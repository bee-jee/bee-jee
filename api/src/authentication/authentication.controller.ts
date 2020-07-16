import {
  Router, Request, Response, NextFunction,
} from 'express';
import { Document } from 'mongoose';
import OAuth2Server, { Request as OAuthRequest, Response as OAuthResponse } from 'oauth2-server';
import { Controller, WsController, WsContext } from '../interfaces/controller.interface';
import UserModel from '../user/user.model';
import validationMiddleware from '../middleware/validation.middleware';
import LoginDto from './login.dto';
import { oauthToken, authMiddleware, oauthServer } from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import { User } from '../user/user.interface';
import ConfigManager from '../interfaces/config.interface';
import OAuthModel from './authentication.service';
import RefreshTokenDto from './refreshToken.dto';
import HttpException from '../exceptions/HttpException';

class AuthenticationController implements Controller, WsController {
  public path = '/auth';

  public router = Router();

  private config: ConfigManager;

  private UserModel = UserModel;

  constructor() {
    this.initialiseRoutes();
  }

  public boot(config: ConfigManager): void {
    this.config = config;
  }

  public subscribeToWs({ ws }: WsContext): void {
    const self = this;
    ws.on('authenticate', (data: any) => {
      const oauthRequest = this.buildOAuthRequest({});
      oauthRequest.headers = {
        ...oauthRequest.headers,
        authorization: `Bearer ${data.token}`,
      };
      const oauthResponse = new OAuth2Server.Response();
      oauthServer.authenticate(oauthRequest, oauthResponse)
        .then((token) => {
          self.UserModel.findById(token.user)
            .then((user: (User & Document) | null) => {
              if (user !== null) {
                ws.isAuthenticated = true;
                ws.user = user;

                ws.send(JSON.stringify({
                  action: 'authenticated',
                  payload: {
                    status: 200,
                  },
                }));
              }
            })
            .catch((err) => {
              console.error(err);
            });
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }

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

  private login = async (request: Request, response: Response) => {
    const data: LoginDto = request.body;
    const oauthRequest = this.buildOAuthRequest({
      ...data,
      grant_type: 'password',
    });
    const oauthResponse = new OAuthResponse(response);
    const token = await oauthToken(oauthRequest, oauthResponse);
    response.send(token);
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
