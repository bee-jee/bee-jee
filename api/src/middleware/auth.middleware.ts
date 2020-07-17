import { Response, NextFunction } from 'express';
import OAuth2Server from 'oauth2-server';
import { Document } from 'mongoose';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import UserModel from '../user/user.model';
import InvalidAuthenticationTokenException from '../exceptions/InvalidAuthenticationTokenException';
import OAuthModel from '../authentication/authentication.service';
import { WsNextFunction, WebsocketWithBeeJee } from '../interfaces/websocket.interface';
import { User } from '../user/user.interface';
import { Actions } from '../../../common/collab';

export const oauthServer = new OAuth2Server({
  model: OAuthModel,
  accessTokenLifetime: 60 * 60,
  allowBearerTokensInQueryString: true,
});

export const oauthToken = oauthServer.token.bind(oauthServer);

export async function authMiddleware(request: RequestWithUser,
  response: Response, next: NextFunction) {
  const oauthRequest = new OAuth2Server.Request(request);
  const oauthResponse = new OAuth2Server.Response(response);
  try {
    const token = await oauthServer.authenticate(oauthRequest, oauthResponse);
    const user = await UserModel.findById(token.user);
    if (user) {
      request.user = user;
      request.token = token;
      next();
    } else {
      next(new InvalidAuthenticationTokenException());
    }
  } catch (err) {
    next(new InvalidAuthenticationTokenException(err.message));
  }
}

function sendNotAuthorised(ws: WebsocketWithBeeJee) {
  ws.send(JSON.stringify({
    action: Actions.NOT_AUTHENTICATED,
  }));
}

export function authWsMiddleware(ws: WebsocketWithBeeJee, payload: any, next: WsNextFunction) {
  if ('Authorization' in payload && typeof payload.Authorization === 'string') {
    const accessToken = payload.Authorization as string;
    const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = process.env;
    const oauthRequest = new OAuth2Server.Request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': 0,
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        client_id: OAUTH_CLIENT_ID,
        client_secret: OAUTH_CLIENT_SECRET,
      },
      query: {},
    });
    const oauthResponse = new OAuth2Server.Response();
    oauthServer.authenticate(oauthRequest, oauthResponse)
      .then((token) => {
        UserModel.findById(token.user)
          .then((user: (User & Document) | null) => {
            if (user !== null) {
              next({
                user,
              });
            } else {
              sendNotAuthorised(ws);
            }
          })
          .catch(() => {
            sendNotAuthorised(ws);
          });
      })
      .catch(() => {
        sendNotAuthorised(ws);
      });
  } else {
    sendNotAuthorised(ws);
  }
}
