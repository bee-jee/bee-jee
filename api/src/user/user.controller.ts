import {
  Router,
  Response,
  NextFunction,
  Request,
} from 'express';
import bcrypt from 'bcrypt';
import { isValidObjectId } from 'mongoose';
import cryptoRandomString from 'crypto-random-string';
import { autoInjectable } from 'tsyringe';
import { Controller } from '../interfaces/controller.interface';
import { authMiddleware, guestMiddleware } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import validationMiddleware from '../middleware/validation.middleware';
import ChangeOwnPasswordDto from './changeOwnPassword.dto';
import UserModel from './user.model';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import { ValidationException } from '../exceptions/ValidationException';
import adminMiddleware from '../middleware/admin.middleware';
import InvalidObjectIdException from '../exceptions/InvalidObjectIdException';
import CreateUserDto from './createUser.dto';
import EditUserDto from './editUser.dto';
import ChangePasswordDto from './changePassword.dto';
import { RegisterUserDto } from './registerUser.dto';
import { UserService } from './user.service';
import { ConfirmEmailDto } from './confirmEmail.dto';
import { CannotConfirmEmailException } from '../exceptions/UsernameNotFoundException';
import UserIsAlreadyConfirmed from '../exceptions/UserIsAlreadyConfirmedException';
import { millisInMinutes } from '../utils/date';
import EmailConfirmTooFrequent from '../exceptions/EmailConfirmTooFrequent';

const USERS_PER_PAGE = 30;

const EMAIL_CONFIRM_RESEND_FREQUENCY_MINUTES = 5;

@autoInjectable()
class UserController implements Controller {
  public path = '/user';

  public router = Router();

  private UserModel = UserModel;

  constructor(private userService: UserService) {}

  public boot() {
    this.initialiseRoutes();
  }

  private initialiseRoutes() {
    this.router.post(`${this.path}/changeOwnPassword`, authMiddleware,
      validationMiddleware(ChangeOwnPasswordDto), this.changeOwnPassword);
    this.router.patch(`${this.path}/:id/changePassword`, authMiddleware,
      validationMiddleware(ChangePasswordDto), this.changePassword);
    this.router.get(`${this.path}/`, authMiddleware, adminMiddleware, this.listUsers);
    this.router.post(`${this.path}/`, authMiddleware, adminMiddleware,
      validationMiddleware(CreateUserDto), this.createUser);
    this.router.post(`${this.path}/register`, guestMiddleware,
      validationMiddleware(RegisterUserDto), this.registerUser);
    this.router.post(`${this.path}/confirmEmail`, guestMiddleware,
      validationMiddleware(ConfirmEmailDto), this.confirmEmail);
    this.router.post(`${this.path}/resendConfirmationEmail/:id`, guestMiddleware, this.resendEmailConfirm);
    this.router.get(`${this.path}/:id`, authMiddleware, adminMiddleware, this.getUserById);
    this.router.patch(`${this.path}/:id`, authMiddleware, adminMiddleware,
      validationMiddleware(EditUserDto), this.editUser);
    this.router.delete(`${this.path}/:id`, authMiddleware, adminMiddleware, this.deleteUser);
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

  private listUsers = async (request: RequestWithUser, response: Response) => {
    const page = (parseFloat(request.query.page as string)) || 1;
    const users = await this.UserModel.find({}, null, {
      skip: (page - 1) * USERS_PER_PAGE,
      limit: USERS_PER_PAGE,
    });
    response.send({
      items: users,
      countPerPage: USERS_PER_PAGE,
      totalCount: await this.UserModel.estimatedDocumentCount(),
    });
  };

  private getUserById = async (request: RequestWithUser, response: Response,
    next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const user = await this.UserModel.findOne({ _id: id });
    if (user !== null) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  };

  private createUser = async (request: RequestWithUser, response: Response) => {
    const {
      username, password, firstName, lastName, role,
    }: CreateUserDto = request.body;
    const createdUser = new this.UserModel({
      username,
      password: await bcrypt.hash(password, 10),
      firstName,
      lastName,
      role,
      confirm: true,
      created: new Date(),
      updated: new Date(),
    });
    const savedUser = await createdUser.save();
    response.send(savedUser);
  };

  private editUser = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const { firstName, lastName, role }: EditUserDto = request.body;
    const user = await this.UserModel.findByIdAndUpdate(id, {
      firstName,
      lastName,
      role,
      updated: new Date(),
    });
    if (user) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  };

  private changePassword = async (request: RequestWithUser, response: Response,
    next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    const data: ChangePasswordDto = request.body;
    const user = await this.UserModel.findByIdAndUpdate(id, {
      password: await bcrypt.hash(data.newPassword, 10),
    });
    if (!user) {
      next(new UserNotFoundException(id));
      return;
    }
    response.send({
      status: 'ok',
    });
  };

  private deleteUser = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }
    if (await this.UserModel.findOneAndDelete({ _id: id }) !== null) {
      response.send({
        _id: id,
        status: 'deleted',
      });
    } else {
      next(new UserNotFoundException(id));
    }
  };

  private registerUser = async (request: Request, response: Response) => {
    const {
      username, password, firstName, lastName,
      email,
    }: RegisterUserDto = request.body;
    const newUser = new this.UserModel({
      username,
      password: await bcrypt.hash(password, 10),
      firstName,
      lastName,
      role: 'user',
      secret: await cryptoRandomString.async({ length: 15, type: 'url-safe' }),
      confirm: false,
      email,
      created: new Date(),
      updated: new Date(),
    });
    const savedUser = await newUser.save();

    try {
      await this.userService.sendUserConfirmEmail(savedUser);
    } catch (err) {
      console.error(err);
    }

    response.send(savedUser);
  };

  private confirmEmail = async (request: Request, response: Response, next: NextFunction) => {
    const { username, secret }: ConfirmEmailDto = request.body;
    const user = await this.UserModel.findOne({ username, secret });
    if (user) {
      if (user.confirm) {
        next(new UserIsAlreadyConfirmed());
        return;
      }

      user.confirm = true;
      user.updated = new Date();
      await user.save();

      response.send({
        status: 'ok',
        message: 'Your email address has been confirmed succesfully, you can now log in to the app.',
      });
      return;
    }
    next(new CannotConfirmEmailException());
  };

  private resendEmailConfirm = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;

    if (!isValidObjectId(id)) {
      next(new InvalidObjectIdException(id));
      return;
    }

    const user = await this.UserModel.findById(id);
    if (user) {
      if (user.confirm) {
        next(new UserIsAlreadyConfirmed());
        return;
      }
      if (user.lastConfirmSend) {
        const diffInMinutes = millisInMinutes(
          (new Date()).valueOf() - user.lastConfirmSend.valueOf(),
        );
        if (diffInMinutes < EMAIL_CONFIRM_RESEND_FREQUENCY_MINUTES) {
          next(new EmailConfirmTooFrequent());
          return;
        }
      }

      try {
        await this.userService.sendUserConfirmEmail(user);
        response.send({
          status: 'ok',
          message: 'The confirmation email is sent successfully, please also check the spam folder if you still cannot see it.',
        });
      } catch (err) {
        console.error(err);
      }
      return;
    }
    next(new UserNotFoundException(id));
  };
}

export default UserController;
