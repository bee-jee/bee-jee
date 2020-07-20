import {
  Router,
  Response,
  NextFunction,
} from 'express';
import bcrypt from 'bcrypt';
import { Controller } from '../interfaces/controller.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import validationMiddleware from '../middleware/validation.middleware';
import ChangeOwnPasswordDto from './changeOwnPassword.dto';
import UserModel from './user.model';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import { ValidationException } from '../exceptions/ValidationException';

class UserController implements Controller {
  public path = '/user';

  public router = Router();

  private UserModel = UserModel;

  public boot() {
    this.initialiseRoutes();
  }

  private initialiseRoutes() {
    this.router.post(`${this.path}/changeOwnPassword`, authMiddleware,
      validationMiddleware(ChangeOwnPasswordDto), this.changeOwnPassword);
  }

  private changeOwnPassword = async (request: RequestWithUser, response: Response,
    next: NextFunction) => {
    const data: ChangeOwnPasswordDto = request.body;
    const user = await this.UserModel.findById(request.user._id);
    if (!user) {
      next(new UserNotFoundException(request.user._id));
      return;
    }
    const password = user.get('password', null, { getters: false });
    if (
      !password
      || await bcrypt.compare(data.currentPassword, password)
    ) {
      await this.UserModel.updateOne({
        _id: user._id,
      }, {
        password: await bcrypt.hash(data.newPassword, 10),
      }, {
        upsert: true,
      });
      response.send({
        status: 'ok',
      });
    } else {
      next(new ValidationException({
        currentPassword: [
          'The current password is invalid',
        ],
      }));
    }
  };
}

export default UserController;
