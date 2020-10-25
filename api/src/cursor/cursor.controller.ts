import { Router } from 'express';
import { container } from 'tsyringe';
import { Controller, WsContext, WsController } from '../interfaces/controller.interface';
import NoteModel from '../note/note.model';
import { Actions, Colors } from '../../../common/collab';
import { Cursor } from './cursor.interface';
import broadcast from '../utils/ws';
import { WebSocketWithBeeJee } from '../websocket/websocket.interface';
import WebSocketService from '../websocket/websocket.service';

class CursorController implements Controller, WsController {
  public path = '/cursor';

  public router = Router();

  private noteCursors = new Map<string, Map<string, Cursor>>();

  private noteSameUserCounter = new Map<string, number>();

  private noteUserCounter = new Map<string, number>();

  private NoteModel = NoteModel;

  private webSocketService: WebSocketService;

  constructor() {
    this.webSocketService = container.resolve(WebSocketService);
  }

  public boot() {}

  public subscribeToWs({ ws }: WsContext) {
    const self = this;
    const { user } = ws;

    ws.on(Actions.ENTER_NOTE, async (payload) => {
      const note = await self.NoteModel.findById(payload._id);
      if (note === null) {
        return;
      }
      const idForCursors = note._id.toString();
      const currCursors: Map<string, Cursor> = this.noteCursors.get(idForCursors)
        || new Map<string, Cursor>();
      const idForSameUserCounter = `${idForCursors}-${user._id.toString()}`;
      const sameUserCount = this.noteSameUserCounter.get(idForSameUserCounter) || 0;
      const userCount = this.noteUserCounter.get(idForCursors) || 0;
      const id = `${user._id}-${sameUserCount}`;
      const wsCursorIds: Map<string, string> = ws.cursorIds || new Map<string, string>();
      wsCursorIds.set(idForCursors, id);
      ws.cursorIds = wsCursorIds;
      this.noteSameUserCounter.set(idForSameUserCounter, sameUserCount + 1);
      this.noteUserCounter.set(idForCursors, userCount + 1);
      const cursor: Cursor = {
        id,
        color: Colors[userCount % Colors.length],
        name: user.fullName || '',
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
      const webSockets = this.webSocketService.getWebSocketsByNoteId(idForCursors);
      broadcast(webSockets, JSON.stringify({
        action: Actions.USER_ENTERED,
        payload: cursor,
      }), {
        except: ws,
      });
    });

    ws.on(Actions.USER_LEFT, ({ _id }) => {
      const id = self.removeCursor(ws, { _id });
      if (id !== undefined) {
        const webSockets = this.webSocketService.getWebSocketsByNoteId(id);
        broadcast(webSockets, JSON.stringify({
          action: Actions.USER_LEFT,
          payload: {
            id,
          },
        }));
      }
    });

    ws.on('close', () => {
      if (!ws.cursorIds) {
        return;
      }
      ws.cursorIds.forEach((_: string, idForCursors: string) => {
        const id = self.removeCursor(ws, {
          _id: idForCursors,
        });
        if (id !== undefined) {
          const webSockets = this.webSocketService.getWebSocketsByNoteId(idForCursors);
          broadcast(webSockets, JSON.stringify({
            action: Actions.USER_LEFT,
            payload: {
              id,
            },
          }));
        }
      });
    });

    ws.on(Actions.CURSOR_UPDATED, async (payload) => {
      const {
        id, index, length,
      } = payload;
      const cursor = this.getCursor(payload._id, id);
      if (cursor === undefined) {
        return;
      }
      cursor.index = index;
      cursor.length = length;
      broadcast(this.webSocketService.getWebSocketsByNoteId(payload._id), JSON.stringify({
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

  private removeCursor(ws: WebSocketWithBeeJee, { _id }: { _id: string }): string | undefined {
    if (!ws.cursorIds) {
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
