import { Router, Request, Response } from 'express';
import Controller from '../interfaces/controller.interface';
import { NoteModel } from './note.model';
import validationMiddleware from '../middleware/validation.middleware';
import CreateNoteDto from './note.dto';
import cleanHtml from '../utils/html';

class NoteController implements Controller {
  public path = '/note';

  public router = Router();

  private NoteModel = NoteModel;

  constructor() {
    this.initialiseRoutes();
  }

  private initialiseRoutes() {
    this.router.post(`${this.path}/create`, validationMiddleware(CreateNoteDto), this.createNote);
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
}

export default NoteController;
