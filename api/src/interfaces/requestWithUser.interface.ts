import { Request } from 'express';
import OAuth2Server from 'oauth2-server';
import { Document } from 'mongoose';
import { User } from '../user/user.interface';

interface RequestWithUser extends Request {
  user: (User & Document);
  token: OAuth2Server.Token;
}

export default RequestWithUser;
