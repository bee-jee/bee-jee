import { Document } from 'mongoose';
import { User } from '../user/user.interface';

export enum Visibility {
  Private = 'private',
  AnyOneWithLink = 'anyone_with_link',
  Users = 'users',
}

export enum Permission {
  Read = 'read',
  Write = 'write',
}

export interface UserWithPermission {
  user: (User & Document) | string;
  permission: Permission,
}

export interface UserSharedNote {
  user: string | (User & Document);
  note: string;
  permission: Permission;
  isViewed: boolean;
}
