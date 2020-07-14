import { Router } from 'express';
import { Controller, WsContext } from '../interfaces/controller.interface';
import NoteModel from '../note/note.model';
import { Actions, Colors } from '../../../common/collab';
import { Cursor } from './cursor.interface';
import broadcast from '../utils/ws';
import WebsocketWithBeeJee from '../interfaces/websocket.interface';

class CursorController implements Controller {
  public path = '/cursor';

  public router = Router();

  private noteCursors = new Map<string, Map<string, Cursor>>();

  private userNoteInstanceCounter = new Map<string, number>();

  private NoteModel = NoteModel;

  public subscribeToWs({ ws, wss }: WsContext) {
    const self = this;

    ws.on(Actions.ENTER_NOTE, async ({ _id }) => {
      if (!ws.isAuthenticated || !ws.user) {
        return;
      }
      const { user } = ws;
      const note = await self.NoteModel.findById(_id);
      if (note === null || user === null) {
        return;
      }
      const idForCursors = `${note._id}`;
      const currCursors: Map<string, Cursor> = this.noteCursors.get(idForCursors)
        || new Map<string, Cursor>();
      const idForCounter = `${idForCursors}-${user._id}`;
      const sameUserCount = this.userNoteInstanceCounter.get(idForCounter) || 0;
      const id = `${user._id}-${sameUserCount}`;
      const wsCursorIds: Map<string, string> = ws.cursorIds || new Map<string, string>();
      wsCursorIds.set(idForCursors, id);
      ws.cursorIds = wsCursorIds;
      this.userNoteInstanceCounter.set(idForCounter, sameUserCount + 1);
      const cursor: Cursor = {
        id,
        color: Colors[currCursors.size % Colors.length],
        name: user.fullName,
      };
      currCursors.set(id, cursor);
      this.noteCursors.set(idForCursors, currCursors);
      ws.send(JSON.stringify({
        action: Actions.NOTE_ENTERED,
        payload: {
          ...cursor,
          currCursors: Array.from(currCursors).reduce((obj: any, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {}),
        },
      }));
      broadcast(wss, JSON.stringify({
        action: Actions.USER_ENTERED,
        payload: cursor,
      }), {
        except: ws,
      });
    });

    ws.on(Actions.USER_LEFT, ({ _id }) => {
      const id = self.removeCursor(ws, { _id });
      if (id !== undefined) {
        broadcast(wss, JSON.stringify({
          action: Actions.USER_LEFT,
          payload: {
            id,
          },
        }));
      }
    });

    ws.on('close', () => {
      if (!ws.isAuthenticated || !ws.user || !ws.cursorIds) {
        return;
      }
      ws.cursorIds.forEach((_: string, idForCursors: string) => {
        const id = self.removeCursor(ws, {
          _id: idForCursors,
        });
        if (id !== undefined) {
          broadcast(wss, JSON.stringify({
            action: Actions.USER_LEFT,
            payload: {
              id,
            },
          }));
        }
      });
    });

    ws.on(Actions.CURSOR_UPDATED, async ({
      _id, id, index, length,
    }) => {
      if (!ws.isAuthenticated || !ws.user) {
        return;
      }
      const cursor = this.getCursor(_id, id);
      if (cursor === undefined) {
        return;
      }
      cursor.index = index;
      cursor.length = length;
      broadcast(wss, JSON.stringify({
        action: Actions.CURSOR_UPDATED,
        payload: cursor,
      }), {
        except: ws,
      });
    });
  }

  private getCursor(noteId: string, cursorId: string): Cursor | undefined {
    const cursors = this.noteCursors.get(noteId);
    if (cursors === undefined) {
      return undefined;
    }
    return cursors.get(cursorId);
  }

  private removeCursor(ws: WebsocketWithBeeJee, { _id }: { _id: string }): string | undefined {
    if (!ws.isAuthenticated || !ws.user || !ws.cursorIds) {
      return undefined;
    }
    const idForCursors = `${_id}`;
    const currCursors = this.noteCursors.get(idForCursors);
    if (currCursors !== undefined) {
      const id = ws.cursorIds.get(idForCursors);
      if (id !== undefined) {
        currCursors.delete(id);
      }
      return id;
    }
    return undefined;
  }
}

export default CursorController;
