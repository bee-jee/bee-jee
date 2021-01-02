import { Document } from 'mongoose';
import { autoInjectable } from 'tsyringe';
import CreateNoteDto from './createNote.dto';
import { Permission, UserSharedNote, UserWithPermission } from '../share/share.interface';
import NoteModel from './note.model';
import { User } from '../user/user.interface';
import UserSharedNoteModel from '../share/share.model';
import UserModel from '../user/user.model';
import { arrayDiff } from '../utils/array';
import ConfigService from '../config/config.service';

export interface SharedUsersRequest {
  username: string;
  permission: Permission;
}

@autoInjectable()
export class NoteContentService {
  constructor(config: ConfigService) {
    const contentPath = config.get('NOTE_CONTENT_PATH');
    if (!contentPath) {
      throw new Error('NOTE_CONTENT_PATH is missing');
    }
  }

  public async createNote({
    title, visibility, sharedUsers,
    parentNoteId,
  }: CreateNoteDto, author: User & Document) {
    const userWithPermissions = await this.sharedUsersRequestToWithPermission(sharedUsers);
    const pathIds: string[] = [];
    let parent = parentNoteId;
    if (parentNoteId) {
      const parentNote = await NoteModel.findById(parentNoteId);
      if (parentNote) {
        pathIds.concat((parentNote.path || '/')
          .split('/')
          .filter((value) => !!value));
        parent = parentNote._id.toString();
        if (parent) {
          pathIds.push(parent);
        }
      } else {
        parent = undefined;
      }
    }
    const createdNote = new NoteModel({
      title,
      visibility,
      sharedUsers: userWithPermissions,
      author: author._id,
      created: Date.now(),
      updated: Date.now(),
      parent,
      path: `/${pathIds.join('/')}`,
    });
    const savedNote = await createdNote.save();
    await Promise.all(userWithPermissions.map(async (user) => {
      const newUserSharedNote = new UserSharedNoteModel({
        user: typeof user.user === 'string' ? user.user : user.user._id,
        note: savedNote._id,
        permission: user.permission,
      });
      await newUserSharedNote.save();
    }));
    return savedNote;
  }

  public async sharedUsersRequestToWithPermission(sharedUsers: SharedUsersRequest[]) {
    const userWithPermissions: UserWithPermission[] = [];
    (
      await Promise.all(
        sharedUsers.map(async ({ username, permission }) => ({
          user: username.trim() === '' ? null : await UserModel.findOne({ username }),
          permission,
        })),
      )
    )
      .forEach(({ user, permission }) => {
        if (user !== null) {
          userWithPermissions.push({ user, permission });
        }
      });
    return userWithPermissions;
  }

  public async syncSharedUserSharedNotes(id: string, newUserWithPermissions: UserWithPermission[]) {
    const userSharedNotes = await UserSharedNoteModel.find({
      note: id,
    });
    const newUserSharedNotes: UserSharedNote[] = newUserWithPermissions
      .map(({ user, permission }) => ({
        note: id,
        user: typeof user === 'string' ? user : user._id.toString(),
        permission,
        isViewed: false,
      }));
    const fn = (value: UserSharedNote) => {
      if (typeof value.user === 'string') {
        return value.user;
      }
      return value.user._id.toString();
    };
    const toBeAdded = arrayDiff<UserSharedNote>(newUserSharedNotes, userSharedNotes, fn);
    const toBeDeleted = arrayDiff<UserSharedNote>(
      userSharedNotes, newUserSharedNotes, fn,
    ) as (UserSharedNote & Document)[];
    await Promise.all([
      UserSharedNoteModel.insertMany(toBeAdded),
      Promise.all(toBeDeleted.map((value) => UserSharedNoteModel.deleteOne({
        _id: value._id,
      }))),
    ]);
  }
}
