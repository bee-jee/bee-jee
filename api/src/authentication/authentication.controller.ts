import {
  Router, Request, Response, NextFunction,
} from 'express';
import { Request as OAuthRequest, Response as OAuthResponse } from 'oauth2-server';
import { autoInjectable } from 'tsyringe';
import { Document } from 'mongoose';
import { Controller } from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import LoginDto from './login.dto';
import { oauthToken, authMiddleware, guestMiddleware } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import OAuthModel from './authentication.service';
import RefreshTokenDto from './refreshToken.dto';
import HttpException from '../exceptions/HttpException';
import InvalidCredentialsException from '../exceptions/InvalidCredentialsException';
import ConfigService from '../config/config.service';
import { PasswordResetDto } from './passwordReset.dto';
import { User } from '../user/user.interface';
import UserModel from '../user/user.model';
import { UserService } from '../user/user.service';

@autoInjectable()
class AuthenticationController implements Controller {
  public path = '/auth';

  public router = Router();

  constructor(private config: ConfigService, private userService: UserService) {
    this.initialiseRoutes();
  }

  public boot(): void {}

  private initialiseRoutes() {
    this.router.get(`${this.path}/user`, authMiddleware, this.user);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login);
    this.router.post(`${this.path}/logout`, authMiddleware, this.logout);
    this.router.post(`${this.path}/refreshToken`, validationMiddleware(RefreshTokenDto), this.refreshToken);
    this.router.post(
      `${this.path}/forgotPassword`,
      guestMiddleware,
      validationMiddleware(PasswordResetDto),
      this.forgotPassword,
    );
  }

  private user = async (request: RequestWithUser, response: Response) => {
    response.send(request.user);
  };

  private login = async (request: Request, response: Response, next: NextFunction) => {
    const data: LoginDto = request.body;
    const oauthRequest = this.buildOAuthRequest({
      ...data,
      grant_type: 'password',
    });
    const oauthResponse = new OAuthResponse(response);
    try {
      const token = await oauthToken(oauthRequest, oauthResponse);
      response.send(token);
    } catch (err) {
      if (err.inner && err.inner instanceof HttpException) {
        next(err.inner);
        return;
      }
      next(new InvalidCredentialsException());
    }
  };

  private logout = async (request: RequestWithUser, response: Response) => {
    await OAuthModel.revokeToken(request.token);
    response.send({
      status: 'ok',
    });
  };

  private refreshToken = async (request: Request, response: Response, next: NextFunction) => {
    const data: RefreshTokenDto = request.body;
    const oauthRequest = this.buildOAuthRequest({
      grant_type: 'refresh_token',
      refresh_token: data.refreshToken,
    });
    const oauthResponse = new OAuthResponse(response);
    try {
      const token = await oauthToken(oauthRequest, oauthResponse);
      response.send(token);
    } catch (err) {
      next(new HttpException(401, err.message));
    }
  };

  private forgotPassword = async (request: Request, response: Response, next: NextFunction) => {
    const { username, email }: PasswordResetDto = request.body;

    let user: (User & Document) | null = null;

    if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase() });
    } else if (username) {
      user = await UserModel.findOne({ username });
    }

    const sendGenericResponse = () => {
      response.send({
        status: 'ok',
        message: 'Your request has been submitted. If your details exist in our database, then an email will be sent to you with instructions to recover your password.',
      });
    };

    if (!user) {
      sendGenericResponse();
      return;
    }

    try {
      const passwordReset = await this.userService.generatePasswordReset(user);
      await this.userService.sendPasswordReset(user, passwordReset);
    } catch (err) {
      next(err);
      return;
    }

    sendGenericResponse();
  };

  private buildOAuthRequest(data: any): OAuthRequest {
    return new OAuthRequest({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': 0,
      },
      body: {
        ...data,
        client_id: this.config.get('OAUTH_CLIENT_ID'),
        client_secret: this.config.get('OAUTH_CLIENT_SECRET'),
      },
      query: {},
    });
  }
}

export default AuthenticationController;
