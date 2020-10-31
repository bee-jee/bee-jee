import { Document } from 'mongoose';
import { LeveldbPersistence } from 'y-leveldb';
import WebSocket from 'ws';
import * as Y from 'yjs';
import * as path from 'path';
import { autoInjectable } from 'tsyringe';
import CreateNoteDto from './createNote.dto';
import { Permission, UserSharedNote, UserWithPermission } from '../share/share.interface';
import NoteModel from './note.model';
import { User } from '../user/user.interface';
import UserSharedNoteModel from '../share/share.model';
import UserModel from '../user/user.model';
import { Actions, arrayToString } from '../../../common/collab';
import { ROOT_DIR } from '../app';
import { Note, WSSharedNote } from './note.interface';
import broadcast from '../utils/ws';
import { arrayDiff } from '../utils/array';
import WebSocketService from '../websocket/websocket.service';
import ConfigService from '../config/config.service';

export interface SharedUsersRequest {
  username: string;
  permission: Permission;
}

export const buildNoteContentPath = (str: string) => str.replace(/\${WORKSPACE_ROOT_DIR}/, ROOT_DIR);

@autoInjectable()
export class NoteContentService {
  private yPersistence: LeveldbPersistence;

  private sharedNotes: Map<string, WSSharedNote> = new Map<string, WSSharedNote>();

  constructor(config: ConfigService, private webSocketService: WebSocketService) {
    const contentPath = config.get('NOTE_CONTENT_PATH');
    if (!contentPath) {
      throw new Error('NOTE_CONTENT_PATH is missing');
    }
    this.yPersistence = new LeveldbPersistence(path.join(buildNoteContentPath(contentPath)));
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

  public async toSharedNote(note: Note & Document): Promise<WSSharedNote> {
    return {
      note,
      content: null,
    };
  }

  public async bindSharedNoteState(sharedNote: WSSharedNote) {
    if (sharedNote.content) {
      return;
    }
    const { note } = sharedNote;
    const id: string = note._id.toString();
    sharedNote.content = await this.yPersistence.getYDoc(id);
    sharedNote.content.getXmlFragment('xmlContent');
    sharedNote.content.on('update', (update: Uint8Array, origin: any) => {
      this.yPersistence.storeUpdate(id, update);
      broadcast(this.webSocketService.getWebSocketsByNoteId(id), JSON.stringify({
        action: Actions.CONTENT_UPDATED,
        payload: {
          id,
          mergeChanges: arrayToString(update),
        },
      }), {
        except: origin,
      });
    });
  }

  public applyChanges(origin: WebSocket, sharedNote: WSSharedNote, changes: Uint8Array) {
    if (sharedNote.content !== null) {
      Y.applyUpdate(sharedNote.content, changes, origin);
    }
  }

  public sendSyncAll(ws: WebSocket, sharedNote: WSSharedNote) {
    if (sharedNote.content === null) {
      return;
    }
    ws.send(JSON.stringify({
      action: Actions.CONTENT_SYNC_ALL,
      payload: arrayToString(Y.encodeStateAsUpdate(sharedNote.content)),
    }));
  }

  public syncStateVector(ws: WebSocket, sharedNote: WSSharedNote, stateVector: Uint8Array) {
    if (sharedNote.content === null) {
      return;
    }
    const diff = Y.encodeStateAsUpdate(sharedNote.content, stateVector);
    ws.send(JSON.stringify({
      action: Actions.CONTENT_SYNC_STEP1,
      payload: {
        stateVector: arrayToString(Y.encodeStateVector(sharedNote.content)),
        diff: arrayToString(diff),
      },
    }));
  }

  public syncUpdates(sharedNote: WSSharedNote, diff: Uint8Array) {
    if (sharedNote.content === null) {
      return;
    }
    Y.applyUpdate(sharedNote.content, diff);
  }

  public async getOrCreateWSSharedNote(id: string): Promise<WSSharedNote | null> {
    const current = this.sharedNotes.get(id);
    if (current) {
      return current;
    }
    const note = await NoteModel.findById(id);
    if (note) {
      const sharedNote = await this.toSharedNote(note);
      await this.bindSharedNoteState(sharedNote);
      this.sharedNotes.set(id, sharedNote);
      return sharedNote;
    }
    return null;
  }

  public closeConn() {
    this.sharedNotes.forEach((_, id) => {
      const webSockets = this.webSocketService.getWebSocketsByNoteId(id);
      if (webSockets.size === 0) {
        this.sharedNotes.delete(id);
      }
    });
  }

  public getWSSharedNote(id: string): WSSharedNote | null {
    const current = this.sharedNotes.get(id);
    if (current) {
      return current;
    }
    return null;
  }

  public async clearContent(id: string) {
    return this.yPersistence.clearDocument(id);
  }
}
