import { Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import UserModel from '../user/user.model';
import InvalidAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import JWTSecretIsMissingException from '../exceptions/JWSSecretIsMissingException';
import DataStoredInToken from '../interfaces/dataStoredInToken.interface';

async function authMiddleware(request: RequestWithUser, _: Response, next: NextFunction) {
  const { cookies } = request;
  if (cookies && cookies.Authorization) {
    const secret = process.env.JWT_SECRET;
    if (secret === undefined) {
      next(new JWTSecretIsMissingException());
      return;
    }
    try {
      const vertificationResponse = jwt.verify(cookies.Authorization, secret) as DataStoredInToken;
      const { id } = vertificationResponse;
      const user = await UserModel.findById(id);
      if (user) {
        request.user = user;
        next();
      } else {
        next(new InvalidAuthenticationTokenException());
      }
    } catch (error) {
      next(new InvalidAuthenticationTokenException());
    }
  } else {
    next(new InvalidAuthenticationTokenException());
  }
}

export default authMiddleware;
