import { Response, NextFunction } from 'express';
import OAuth2Server from 'oauth2-server';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import UserModel from '../user/user.model';
import InvalidAuthenticationTokenException from '../exceptions/InvalidAuthenticationTokenException';
import OAuthModel from '../authentication/authentication.service';

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
