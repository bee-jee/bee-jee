import * as bcrypt from 'bcrypt';
import {
  Router, Request, Response, NextFunction,
} from 'express';
import { Controller } from '../interfaces/controller.interface';
import AuthenticationService from './authentication.service';
import UserModel from '../user/user.model';
import validationMiddleware from '../middleware/validation.middleware';
import LoginDto from './login.dto';
import InvalidCredentialsException from '../exceptions/InvalidCredentialsException';
import authMiddleware from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';

class AuthenticationController implements Controller {
  public path = '/auth';

  public router = Router();

  private UserModel = UserModel;

  constructor() {
    this.initialiseRoutes();
  }

  private initialiseRoutes() {
    this.router.get(`${this.path}/user`, authMiddleware, this.user);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login);
    this.router.post(`${this.path}/logout`, this.logout);
  }

  private user = async (request: RequestWithUser, response: Response) => {
    response.send(request.user);
  };

  private login = async (request: Request, response: Response, next: NextFunction) => {
    const data: LoginDto = request.body;
    const user = await this.UserModel.findOne({ username: data.username });
    if (user) {
      const passwordMatched = await bcrypt.compare(
        data.password,
        user.get('password', null, { getters: false }),
      );
      if (passwordMatched) {
        const tokenData = AuthenticationService.createToken(user);
        response.setHeader('Set-Cookie', [AuthenticationService.createCookie(tokenData)]);
        response.send(user);
      } else {
        next(new InvalidCredentialsException());
      }
    } else {
      next(new InvalidCredentialsException());
    }
  };

  private logout = async (_: Request, response: Response) => {
    response.setHeader('Set-Cookie', ['Authorization=;Max-age=0']);
    response.send(200);
  };
}

export default AuthenticationController;
