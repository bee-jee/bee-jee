import { Request } from 'express';
import OAuth2Server from 'oauth2-server';
import { User } from '../user/user.interface';

interface RequestWithUser extends Request {
  user: User;
  token: OAuth2Server.Token;
}

export default RequestWithUser;
