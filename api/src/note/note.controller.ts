import {
  Router, Request, Response, NextFunction,
} from 'express';
import * as Y from 'yjs';
import { isValidObjectId } from 'mongoose';
import * as LRU from 'lru-cache';
import { Controller, WsController, WsContext } from '../interfaces/controller.interface';
import NoteModel from './note.model';
import validationMiddleware from '../middleware/validation.middleware';
import CreateNoteDto from './note.dto';
import cleanHtml from '../utils/html';
import NoteNotFoundException from '../exceptions/NoteNotFound';
import InvalidObjectIdException from '../exceptions/InvalidObjectIdException';
import {
  Note, PendingNote, pendingNote, saveContent,
} from './note.interface';
import broadcast from '../utils/ws';
import { stringToArray } from '../../../common/collab';

class NoteController implements Controller, WsController {
  public path = '/note';

  public router = Router();

  private NoteModel = NoteModel;

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

  public async handleWsMessage({ wss, data, ws }: WsContext): Promise<boolean> {
    if (data.action === 'contentUpdated') {
      const { id, mergeChanges } = data.payload;
      if (!isValidObjectId(id)) {
        throw new InvalidObjectIdException(id);
      }
      const note = await this.findNoteByIdAndToPending(id);
      if (note !== null) {
        const changes = stringToArray(mergeChanges);
        if (changes !== null) {
          Y.applyUpdate(note.content, changes, 'websocket');
          note.isDirty = true;
          broadcast(wss, JSON.stringify({
            action: 'contentUpdated',
            payload: {
              id,
              mergeChanges,
            },
          }), {
            except: ws,
          });
        }
      }
      return true;
    }
    return false;
  }

  private initialiseRoutes() {
    this.router.get(this.path, this.getAllNotes);
    this.router.post(`${this.path}/create`, validationMiddleware(CreateNoteDto), this.createNote);
    this.router.patch(`${this.path}/:id`, validationMiddleware(CreateNoteDto, true), this.editNote);
    this.router.get(`${this.path}/:id`, this.getNoteById);
    this.router.delete(`${this.path}/:id`, this.deleteNote);
  }

  private createNote = async (request: Request, response: Response) => {
    const postData: CreateNoteDto = request.body;
    postData.content = cleanHtml(postData.content);
    const createdNote = new this.NoteModel({
      ...postData,
      created: Date.now(),
      updated: Date.now(),
    });
    const savedNote = await createdNote.save();
    response.send(savedNote);
  };

  private getAllNotes = async (_: Request, response: Response) => {
    const notes = await this.NoteModel.find();
    response.send(notes);
  };

  private getNoteById = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const note = await this.NoteModel.findById(id);
    if (note !== null) {
      response.send(note);
    } else {
      next(new NoteNotFoundException(id));
    }
  };

  private editNote = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const data: Note = request.body;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const note = await this.NoteModel.findByIdAndUpdate(id, data, { new: true });
    if (note !== null) {
      response.send(note);
    } else {
      next(new NoteNotFoundException(id));
    }
  };

  private deleteNote = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    if (await this.NoteModel.findByIdAndDelete(id)) {
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
}

export default NoteController;
