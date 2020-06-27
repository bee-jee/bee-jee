import {
  Router, Request, Response, NextFunction,
} from 'express';
import { isValidObjectId } from 'mongoose';
import Controller from '../interfaces/controller.interface';
import NoteModel from './note.model';
import validationMiddleware from '../middleware/validation.middleware';
import CreateNoteDto from './note.dto';
import cleanHtml from '../utils/html';
import NoteNotFoundException from '../exceptions/NoteNotFound';
import InvalidObjectIdException from '../exceptions/InvalidObjectIdException';
import { Note } from './note.interface';

class NoteController implements Controller {
  public path = '/note';

  public router = Router();

  private NoteModel = NoteModel;

  constructor() {
    this.initialiseRoutes();
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
}

export default NoteController;
