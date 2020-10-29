import { Router } from 'express';
import WebSocket from 'ws';
import { WebSocketWithBeeJee } from '../websocket/websocket.interface';

export interface Controller {
  path: string;
  router: Router;
  boot(): void;
}

export interface WsController {
  subscribeToWs(context: WsContext): void;
}

export interface WsContext {
  wss: WebSocket.Server,
  ws: WebSocketWithBeeJee,
}

export function isWsController(controller: Controller): controller is Controller & WsController {
  return 'subscribeToWs' in controller;
}
