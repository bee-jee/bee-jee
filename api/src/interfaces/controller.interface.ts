import { Router } from 'express';
import WebSocket from 'ws';

export interface Controller {
  path: string;
  router: Router;
}

export interface WsController {
  handleWsMessage(context: WsContext): Promise<boolean> | boolean;
}

export interface WsContext {
  wss: WebSocket.Server,
  ws: WebSocket,
  data: any,
}

export function isWsController(controller: Controller): controller is Controller & WsController {
  return 'handleWsMessage' in controller;
}
