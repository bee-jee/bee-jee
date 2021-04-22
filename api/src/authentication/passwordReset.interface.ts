import { Document } from 'mongoose';
import { User } from '../user/user.interface';

export interface PasswordReset {
  userId: string;
  user?: (User & Document);
  secret: string;
  requestedAt: Date;
  reRequestedAt: Date;
}
