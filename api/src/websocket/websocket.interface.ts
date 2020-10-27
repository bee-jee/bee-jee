import WebSocket from 'ws';
import { Document } from 'mongoose';
import http from 'http';
import { Response } from 'express';
import OAuth2Server from 'oauth2-server';
import { User } from '../user/user.interface';
import RequestWithUser from '../interfaces/requestWithUser.interface';

export interface WebSocketWithBeeJee extends WebSocket {
  isAlive?: boolean;
  user: (User & Document);
  token: OAuth2Server.Token;
  cursorIds?: Map<string, string>;
}

export interface WsServerResponse extends http.ServerResponse {
  acceptRequest: (req: RequestWithUser) => Promise<void>,
}

export function isWsServerResponse(res: Response): res is Response & WsServerResponse {
  return 'acceptRequest' in res;
}
