import {
  Router, Request, Response, NextFunction,
} from 'express';
import { Request as OAuthRequest, Response as OAuthResponse } from 'oauth2-server';
import { autoInjectable } from 'tsyringe';
import { Controller } from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import LoginDto from './login.dto';
import { oauthToken, authMiddleware } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import OAuthModel from './authentication.service';
import RefreshTokenDto from './refreshToken.dto';
import HttpException from '../exceptions/HttpException';
import InvalidCredentialsException from '../exceptions/InvalidCredentialsException';
import ConfigService from '../config/config.service';

@autoInjectable()
class AuthenticationController implements Controller {
  public path = '/auth';

  public router = Router();

  constructor(private config: ConfigService) {
    this.initialiseRoutes();
  }

  public boot(): void {}

  private initialiseRoutes() {
    this.router.get(`${this.path}/user`, authMiddleware, this.user);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login);
    this.router.post(`${this.path}/logout`, authMiddleware, this.logout);
    this.router.post(`${this.path}/refreshToken`, validationMiddleware(RefreshTokenDto),
      this.refreshToken);
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
