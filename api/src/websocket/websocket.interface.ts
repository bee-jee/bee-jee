import WebSocket from 'ws';
import { Document } from 'mongoose';
import http from 'http';
import { Response } from 'express';
import { User } from '../user/user.interface';

export interface WebSocketWithBeeJee extends WebSocket {
  isAlive?: boolean;
  user: (User & Document);
  cursorIds?: Map<string, string>;
}

export interface WsServerResponse extends http.ServerResponse {
  acceptUser: (user: User & Document) => Promise<void>,
}

export function isWsServerResponse(res: Response): res is Response & WsServerResponse {
  return 'acceptUser' in res;
}
