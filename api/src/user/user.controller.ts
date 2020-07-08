import {
  Router, Request, Response, NextFunction,
} from 'express';
import { isValidObjectId } from 'mongoose';
import { Controller } from '../interfaces/controller.interface';
import NoteModel from '../note/note.model';
import UserModel from './user.model';
import InvalidObjectIdException from '../exceptions/InvalidObjectIdException';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import NotAuthorisedException from '../exceptions/NotAuthorisedException';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';

class UserController implements Controller {
  public path = '/user';

  public router = Router();

  private NoteModel = NoteModel;

  private UserModel = UserModel;

  constructor() {
    this.initialiseRoutes();
  }

  private initialiseRoutes() {
    this.router.get(`${this.path}/:id`, authMiddleware, this.getUserById);
    this.router.get(`${this.path}/:id/notes`, authMiddleware, this.getAllNotesOfUser);
  }

  private getUserById = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const userQuery = this.UserModel.findById(id);
    if (request.query.withNotes === 'true') {
      userQuery.populate('notes').exec();
    }
    const user = await userQuery;
    if (user !== null) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  };

  private getAllNotesOfUser =
  async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    if (id === request.user._id.toString()) {
      const notes = await this.NoteModel.find({ authorId: id });
      response.send(notes);
      return;
    }
    next(new NotAuthorisedException());
  };
}

export default UserController;
