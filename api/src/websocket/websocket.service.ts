import { Document } from 'mongoose';
import { singleton } from 'tsyringe';
import WebSocket from 'ws';
import { WebSocketWithBeeJee } from './websocket.interface';
import { User } from '../user/user.interface';

@singleton()
class WebSocketService {
  private userWebsockets: Map<string, WebSocket> = new Map();

  private noteWebsockets = new Map<string, Set<WebSocketWithBeeJee>>();

  public addUserWebSocket(user: (Document & User), ws: WebSocket) {
    this.userWebsockets.set(user._id.toString(), ws);
  }

  public getWebSocketByUserId(id: string): WebSocket | undefined {
    return this.userWebsockets.get(id);
  }

  public removeWebSocketByUserId(id: string): boolean {
    return this.userWebsockets.delete(id);
  }

  public addNoteWebSocket(noteId: string, ws: WebSocketWithBeeJee) {
    const websockets = this.noteWebsockets.get(noteId) || new Set<WebSocketWithBeeJee>();
    websockets.add(ws);
    this.noteWebsockets.set(noteId, websockets);
  }

  public getWebSocketsByNoteId(id: string): Set<WebSocketWithBeeJee> {
    return this.noteWebsockets.get(id) || new Set<WebSocketWithBeeJee>();
  }

  public removeWebSocketInNote(id: string, ws: WebSocketWithBeeJee) {
    const webSockets = this.getWebSocketsByNoteId(id);
    webSockets.delete(ws);
    this.noteWebsockets.set(id, webSockets);
  }

  public getNoteWebSockets(): Map<string, Set<WebSocketWithBeeJee>> {
    return this.noteWebsockets;
  }
}

export default WebSocketService;
