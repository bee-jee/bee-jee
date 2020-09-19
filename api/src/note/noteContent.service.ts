import { Document } from 'mongoose';
import { LeveldbPersistence } from 'y-leveldb';
import { Doc, encodeStateAsUpdate } from 'yjs';
import * as path from 'path';
import CreateNoteDto from './createNote.dto';
import { Permission, UserWithPermission } from '../share/share.interface';
import NoteModel from './note.model';
import { User } from '../user/user.interface';
import UserSharedNoteModel from '../share/share.model';
import UserModel from '../user/user.model';
import { encodeDoc } from '../../../common/collab';
import { ROOT_DIR } from '../app';
import ConfigManager from '../interfaces/config.interface';

export interface SharedUsersRequest {
  username: string;
  permission: Permission;
}

export const buildNoteContentPath = (str: string) => str.replace(/\${WORKSPACE_ROOT_DIR}/, ROOT_DIR);

export class NoteContentService {
  private yPersistence: LeveldbPersistence;

  constructor(config: ConfigManager) {
    this.yPersistence = new LeveldbPersistence(path.join(buildNoteContentPath(config.get('NOTE_CONTENT_PATH'))));
  }

  public async createNote({
    title, visibility, sharedUsers,
  }: CreateNoteDto, author: User & Document) {
    const userWithPermissions = await this.sharedUsersRequestToWithPermission(sharedUsers);
    const createdNote = new NoteModel({
      title,
      visibility,
      sharedUsers: userWithPermissions,
      author: author._id,
      created: Date.now(),
      updated: Date.now(),
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
    const newDoc = new Doc();
    await this.yPersistence.storeUpdate(savedNote._id.toString(), encodeStateAsUpdate(newDoc));
    savedNote.content = encodeDoc(newDoc);
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

  public async getNoteContent(noteId: string): Promise<Doc | null> {
    const doc = await this.yPersistence.getYDoc(noteId);
    if (!doc) {
      return null;
    }
    return doc;
  }

  public async storeNoteContentUpdate(noteId: string, update: Uint8Array): Promise<number> {
    return this.yPersistence.storeUpdate(noteId, update);
  }
}
