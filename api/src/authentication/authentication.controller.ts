import * as bcrypt from 'bcrypt';
import {
  Router, Request, Response, NextFunction,
} from 'express';
import * as jwt from 'jsonwebtoken';
import { Document } from 'mongoose';
import { Controller, WsController, WsContext } from '../interfaces/controller.interface';
import AuthenticationService from './authentication.service';
import UserModel from '../user/user.model';
import validationMiddleware from '../middleware/validation.middleware';
import LoginDto from './login.dto';
import InvalidCredentialsException from '../exceptions/InvalidCredentialsException';
import authMiddleware from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import JWTSecretIsMissingException from '../exceptions/JWSSecretIsMissingException';
import DataStoredInToken from '../interfaces/dataStoredInToken.interface';
import { User } from '../user/user.interface';

class AuthenticationController implements Controller, WsController {
  public path = '/auth';

  public router = Router();

  private UserModel = UserModel;

  constructor() {
    this.initialiseRoutes();
  }

  public subscribeToWs({ ws }: WsContext): void {
    const self = this;
    ws.on('authenticate', (data: any) => {
      const secret = process.env.JWT_SECRET;
      if (secret === undefined) {
        throw new JWTSecretIsMissingException();
      }
      jwt.verify(data.token, secret, (err: jwt.VerifyErrors | null, decoded: DataStoredInToken) => {
        if (err !== null) {
          console.error(err);
          return;
        }
        self.UserModel.findById(decoded.id)
          .then((user: (User & Document) | null) => {
            if (user !== null) {
              ws.isAuthenticated = true;

              ws.send(JSON.stringify({
                action: 'authenticated',
                payload: {
                  status: 200,
                },
              }));
            }
          })
          .catch((dbErr) => {
            console.error(dbErr);
          });
      });
    });
  }

  private initialiseRoutes() {
    this.router.get(`${this.path}/user`, authMiddleware, this.user);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login);
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
        response.send(AuthenticationService.createToken(user));
      } else {
        next(new InvalidCredentialsException());
      }
    } else {
      next(new InvalidCredentialsException());
    }
  };
}

export default AuthenticationController;
