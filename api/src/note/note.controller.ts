import {
  Router, Response, NextFunction,
} from 'express';
import { isValidObjectId } from 'mongoose';
import { autoInjectable } from 'tsyringe';
import { Controller } from '../interfaces/controller.interface';
import NoteModel from './note.model';
import validationMiddleware from '../middleware/validation.middleware';
import CreateNoteDto from './createNote.dto';
import NoteNotFoundException from '../exceptions/NoteNotFound';
import InvalidObjectIdException from '../exceptions/InvalidObjectIdException';
import { authMiddleware } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import UserSharedNoteModel from '../share/share.model';
import EditNoteDto from './editNote.dto';
import visiMiddleware from '../middleware/visibility.middleware';
import { NoteContentService as NoteService } from './note.service';

@autoInjectable()
class NoteController implements Controller {
  public path = '/note';

  public router = Router();

  private NoteModel = NoteModel;

  private UserSharedNoteModel = UserSharedNoteModel;

  constructor(private noteService: NoteService) {
    this.initialiseRoutes();
  }

  public boot() {}

  private initialiseRoutes() {
    this.router.get(this.path, authMiddleware, this.getAllNotes);
    this.router.post(`${this.path}/create`, authMiddleware, validationMiddleware(CreateNoteDto), this.createNote);
    this.router.patch(`${this.path}/:id`, authMiddleware, validationMiddleware(EditNoteDto, true), this.editNote);
    this.router.get(`${this.path}/shared/`, authMiddleware, this.getSharedNotes);
    this.router.get(`${this.path}/shared/:id`, visiMiddleware(), this.getSharedNote);
    this.router.get(`${this.path}/numOfUnviewed`, authMiddleware, this.getNumOfUnviewedSharedNotes);
    this.router.get(`${this.path}/:id`, authMiddleware, this.getNoteById);
    this.router.get(`${this.path}/public/:id`, this.getPublicNoteById);
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

  private getPublicNoteById = async (request: RequestWithUser, response: Response,
    next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const note = await this.NoteModel.findOne({
      _id: id,
      guestAccess: true,
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
      guestAccess,
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
      guestAccess,
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
    if (guestAccess === undefined) {
      delete data.guestAccess;
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
