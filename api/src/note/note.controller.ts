import {
  Router, Response, NextFunction,
} from 'express';
import { isValidObjectId } from 'mongoose';
import { autoInjectable } from 'tsyringe';
import { Controller, WsController, WsContext } from '../interfaces/controller.interface';
import NoteModel from './note.model';
import validationMiddleware from '../middleware/validation.middleware';
import CreateNoteDto from './createNote.dto';
import NoteNotFoundException from '../exceptions/NoteNotFound';
import InvalidObjectIdException from '../exceptions/InvalidObjectIdException';
import { stringToArray, Actions } from '../../../common/collab';
import { authMiddleware, authWsMiddleware } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import UserSharedNoteModel from '../share/share.model';
import EditNoteDto from './editNote.dto';
import visiMiddleware, { getUserPermission } from '../middleware/visibility.middleware';
import { NoteContentService as NoteService } from './note.service';
import { Permission } from '../share/share.interface';

@autoInjectable()
class NoteController implements Controller, WsController {
  public path = '/note';

  public router = Router();

  private NoteModel = NoteModel;

  private UserSharedNoteModel = UserSharedNoteModel;

  constructor(private noteService: NoteService) {
    this.initialiseRoutes();
  }

  public boot() {}

  public subscribeToWs({ ws }: WsContext): void {
    const { user } = ws;

    ws.on(Actions.CONTENT_UPDATED, async (payload) => {
      if (!authWsMiddleware(ws)) {
        return;
      }
      const { id, mergeChanges } = payload;
      const sharedNote = this.noteService.getWSSharedNote(id);
      if (sharedNote) {
        const [havePermission, permission] = await getUserPermission(user, sharedNote.note);
        if (!havePermission || permission !== Permission.Write) {
          return;
        }
        this.noteService.applyChanges(ws, sharedNote, stringToArray(mergeChanges));
      }
    });

    ws.on(Actions.ENTER_NOTE, async (payload: any) => {
      if (!authWsMiddleware(ws)) {
        return;
      }
      const sharedNote = await this.noteService.getOrCreateWSSharedNote(payload._id);
      if (sharedNote) {
        this.noteService.sendSyncAll(ws, sharedNote);
      }
    });

    ws.on(Actions.USER_LEFT, () => {
      this.noteService.closeConn();
    });

    ws.on(Actions.CONTENT_SYNC_ALL, async (payload: any) => {
      if (!authWsMiddleware(ws)) {
        return;
      }
      const sharedNote = this.noteService.getWSSharedNote(payload._id);
      if (sharedNote) {
        this.noteService.sendSyncAll(ws, sharedNote);
      }
    });

    ws.on('close', () => {
      this.noteService.closeConn();
    });
  }

  private initialiseRoutes() {
    this.router.get(this.path, authMiddleware, this.getAllNotes);
    this.router.post(`${this.path}/create`, authMiddleware, validationMiddleware(CreateNoteDto), this.createNote);
    this.router.patch(`${this.path}/:id`, authMiddleware, validationMiddleware(EditNoteDto, true), this.editNote);
    this.router.get(`${this.path}/shared/`, authMiddleware, this.getSharedNotes);
    this.router.get(`${this.path}/shared/:id`, visiMiddleware(), this.getSharedNote);
    this.router.get(`${this.path}/numOfUnviewed`, authMiddleware, this.getNumOfUnviewedSharedNotes);
    this.router.get(`${this.path}/:id`, authMiddleware, this.getNoteById);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteNote);
  }

  private createNote = async (request: RequestWithUser, response: Response) => {
    const postData: CreateNoteDto = request.body;
    const savedNote = await this.noteService.createNote(postData, request.user);
    response.send(savedNote);
  };

  private getAllNotes = async (request: RequestWithUser, response: Response) => {
    const notes = await this.NoteModel.find({
      author: request.user._id,
    });
    response.send(notes);
  };

  private getNoteById = async (request: RequestWithUser, response: Response,
    next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const note = await this.NoteModel.findOne({ _id: id, author: request.user._id })
      .populate({
        path: 'sharedUsers',
        populate: {
          path: 'user',
        },
      });
    if (note !== null) {
      response.send(note);
    } else {
      next(new NoteNotFoundException(id));
    }
  };

  private getNumOfUnviewedSharedNotes = async (request: RequestWithUser, response: Response) => {
    const numOfUnviewedSharedNotes = await this.UserSharedNoteModel.countDocuments({
      user: request.user._id,
      isViewed: false,
    });
    response.send({
      num: numOfUnviewedSharedNotes,
    });
  };

  private getSharedNote = async (request: RequestWithUser, response: Response,
    next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const sharedNote = await this.UserSharedNoteModel.findOneAndUpdate({
      note: id,
      user: request.user._id,
    }, {
      isViewed: true,
    }, { new: true })
      .populate('note');
    if (sharedNote !== null) {
      response.send(sharedNote);
    } else {
      next(new NoteNotFoundException(id));
    }
  };

  private getSharedNotes = async (request: RequestWithUser, response: Response) => {
    const userSharedNotes = await this.UserSharedNoteModel.find({
      user: request.user._id,
    })
      .populate('note');
    response.send(userSharedNotes);
  };

  private editNote = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const {
      title, content, visibility, sharedUsers,
    }: EditNoteDto = request.body;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const userWithPermissions = sharedUsers
      ? await this.noteService.sharedUsersRequestToWithPermission(sharedUsers) : undefined;
    const data = {
      title,
      content,
      visibility,
    };
    if (title === undefined) {
      delete data.title;
    }
    if (content === undefined) {
      delete data.content;
    }
    if (visibility === undefined) {
      delete data.visibility;
    }
    const note = await this.NoteModel.findOneAndUpdate({
      _id: id,
      author: request.user._id,
    }, data, { new: true });
    if (userWithPermissions !== undefined) {
      await this.noteService.syncSharedUserSharedNotes(id, userWithPermissions);
    }
    if (note !== null) {
      response.send(note);
    } else {
      next(new NoteNotFoundException(id));
    }
  };

  private deleteNote =
  async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const note = await this.NoteModel.findOneAndDelete({ _id: id, author: request.user._id });
    if (note !== null) {
      await this.noteService.clearContent(note._id.toString());
      await this.UserSharedNoteModel.deleteMany({
        note: note._id,
      });
      response.send({
        _id: id,
        status: 200,
      });
    } else {
      next(new NoteNotFoundException(id));
    }
  };
}

export default NoteController;
