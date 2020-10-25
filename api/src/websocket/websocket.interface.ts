import WebSocket from 'ws';
import { Document } from 'mongoose';
import { User } from '../user/user.interface';

export interface WebSocketWithBeeJee extends WebSocket {
  isAlive?: boolean;
  cursorIds?: Map<string, string>;
}

export interface MiddlewareData {
  user: (User & Document) | undefined;
}

export type WsNextFunction = (data: MiddlewareData) => void;
