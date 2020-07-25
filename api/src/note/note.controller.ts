import {
  Router, Response, NextFunction,
} from 'express';
import * as Y from 'yjs';
import { isValidObjectId } from 'mongoose';
import LRU from 'lru-cache';
import WebSocket from 'ws';
import { Controller, WsController, WsContext } from '../interfaces/controller.interface';
import NoteModel from './note.model';
import validationMiddleware from '../middleware/validation.middleware';
import CreateNoteDto from './createNote.dto';
import NoteNotFoundException from '../exceptions/NoteNotFound';
import InvalidObjectIdException from '../exceptions/InvalidObjectIdException';
import {
  PendingNote, pendingNote, saveContent,
} from './note.interface';
import broadcast from '../utils/ws';
import { stringToArray, Actions } from '../../../common/collab';
import { authMiddleware, authWsMiddleware } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import { MiddlewareData } from '../interfaces/websocket.interface';
import App from '../app';
import { Permission, UserWithPermission } from '../share/share.interface';
import UserModel from '../user/user.model';
import UserSharedNoteModel from '../share/share.model';
import EditNoteDto from './editNote.dto';
import visiMiddleware from '../middleware/visibility.middleware';

interface SharedUsersRequest {
  username: string;
  permission: Permission;
}

class NoteController implements Controller, WsController {
  public path = '/note';

  public router = Router();

  private NoteModel = NoteModel;

  private UserModel = UserModel;

  private UserSharedNoteModel = UserSharedNoteModel;

  private noteCache: LRU<string, PendingNote | null>;

  constructor() {
    this.noteCache = new LRU({
      max: 100,
      maxAge: 60000,
      dispose: (_, note) => {
        saveContent(this.NoteModel, note);
      },
    });
    setInterval(() => {
      this.noteCache.forEach((note: PendingNote | null) => {
        saveContent(this.NoteModel, note);
      });
    }, 500);
    this.initialiseRoutes();
  }

  public boot() { }

  public subscribeToWs({ ws }: WsContext): void {
    ws.on('contentUpdated', async (payload) => {
      authWsMiddleware(ws, payload, async ({ user }: MiddlewareData) => {
        if (!user) {
          return;
        }
        const { id, mergeChanges } = payload;
        if (!isValidObjectId(id)) {
          console.error(new InvalidObjectIdException(id));
          return;
        }
        const note = await this.findNoteByIdAndToPending(id);
        if (note !== null) {
          const changes = stringToArray(mergeChanges);
          if (changes !== null) {
            Y.applyUpdate(note.content, changes, 'websocket');
            note.isDirty = true;
            const websockets = App.noteWebsockets.get(`${note.note._id}`) || new Set<WebSocket>();
            broadcast(websockets, JSON.stringify({
              action: Actions.CONTENT_UPDATED,
              payload: {
                id,
                mergeChanges,
              },
            }), {
              except: ws,
            });
          }
        }
      });
    });
  }

  private initialiseRoutes() {
    this.router.get(this.path, authMiddleware, this.getAllNotes);
    this.router.post(`${this.path}/create`, authMiddleware, validationMiddleware(CreateNoteDto), this.createNote);
    this.router.patch(`${this.path}/:id`, authMiddleware, validationMiddleware(EditNoteDto, true), this.editNote);
    this.router.get(`${this.path}/shared/`, authMiddleware, this.getSharedNotes);
    this.router.get(`${this.path}/shared/:id`, visiMiddleware(), this.getSharedNote);
    this.router.get(`${this.path}/:id`, authMiddleware, this.getNoteById);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteNote);
  }

  private createNote = async (request: RequestWithUser, response: Response) => {
    const postData: CreateNoteDto = request.body;
    const userWithPermissions = await this.sharedUsersRequestToWithPermission(postData.sharedUsers);
    delete postData.sharedUsers;
    const createdNote = new this.NoteModel({
      ...postData,
      sharedUsers: userWithPermissions,
      author: request.user._id,
      created: Date.now(),
      updated: Date.now(),
    });
    const savedNote = await createdNote.save();
    await Promise.all(userWithPermissions.map(async (user) => {
      const newUserSharedNote = new UserSharedNoteModel({
        user: typeof user.user === 'string' ? user.user : user.user._id,
        note: savedNote._id,
        permission: user.permission,
      });
      await newUserSharedNote.save();
    }));
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

  private getSharedNote = async (request: RequestWithUser, response: Response,
    next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const note = await this.NoteModel.findOne({ _id: id })
      .populate({
        path: 'sharedUsers',
        match: {
          user: request.user._id,
        },
        populate: {
          path: 'user',
        },
      });
    if (note !== null) {
      if (note.sharedUsers !== undefined) {
        await Promise.all(
          note.sharedUsers.map(async (sharedUser) => {
            await this.UserSharedNoteModel.updateOne({
              _id: sharedUser._id,
            }, {
              isViewed: true,
            });
          }),
        );
      }
      response.send(note);
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
      ? await this.sharedUsersRequestToWithPermission(sharedUsers) : undefined;
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
    await this.UserSharedNoteModel.deleteMany({
      note: id,
    });
    if (userWithPermissions !== undefined) {
      await this.UserSharedNoteModel.insertMany(userWithPermissions.map((user) => ({
        note: id,
        user: typeof user.user === 'string' ? user.user : user.user._id,
        permission: user.permission,
      })));
    }
    if (note !== null) {
      response.send(note);
    } else {
      next(new NoteNotFoundException(id));
    }
  };

  private deleteNote = async (request: RequestWithUser, response: Response, next: NextFunction) => {
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

  private findNoteByIdAndToPending = async (id: string): Promise<PendingNote | null> => {
    if (this.noteCache.has(id)) {
      return this.noteCache.get(id) || null;
    }
    const note = pendingNote(await this.NoteModel.findById(id));
    this.noteCache.set(id, note);
    return note;
  };

  private sharedUsersRequestToWithPermission = async (sharedUsers: SharedUsersRequest[]) => {
    const userWithPermissions: UserWithPermission[] = [];
    (
      await Promise.all(
        sharedUsers.map(async ({ username, permission }) => ({
          user: username.trim() === '' ? null : await this.UserModel.findOne({ username }),
          permission,
        })),
      )
    )
      .forEach(({ user, permission }) => {
        if (user !== null) {
          userWithPermissions.push({ user, permission });
        }
      });
    return userWithPermissions;
  };
}

export default NoteController;
