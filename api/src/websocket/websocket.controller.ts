import {
  NextFunction,
  Router,
  Application,
  Response,
} from 'express';
import { autoInjectable, container } from 'tsyringe';
import WebSocket from 'ws';
import http from 'http';
import { Socket } from 'net';
import { Document } from 'mongoose';
import { Actions } from '../../../common/collab';
import HttpException from '../exceptions/HttpException';
import {
  Controller,
  isWsController,
  WsContext,
  WsController,
} from '../interfaces/controller.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import { isWsServerResponse, WebSocketWithBeeJee, WsServerResponse } from './websocket.interface';
import WebSocketService from './websocket.service';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import { User } from '../user/user.interface';

@autoInjectable()
class WebSocketController implements Controller, WsController {
  public path = '/ws';

  public router = Router();

  constructor(private webSocketService: WebSocketService) {
    this.initialiseRoutes();
  }

  public boot() {
    const wss = new WebSocket.Server({ noServer: true });
    const server = container.resolve<http.Server>('server');
    const app = container.resolve<Application>('app');

    wss.on('connection', (ws: WebSocketWithBeeJee) => {
      ws.isAlive = true;

      const wsContext: WsContext = { wss, ws };
      const controllers = container.resolve<Controller[]>('controllers');
      controllers.forEach((controller) => {
        if (isWsController(controller)) {
          controller.subscribeToWs(wsContext);
        }
      });

      ws.on('pong', function heartbeat(this: WebSocketWithBeeJee) {
        this.isAlive = true;
      });

      ws.on('message', (data: WebSocket.Data) => {
        if (typeof data === 'string') {
          try {
            const event = JSON.parse(data);
            if (typeof event.action !== 'string') {
              console.log('Invalid data received');
              return;
            }
            ws.emit(event.action, event.payload);
          } catch (err) {
            console.log('Not an event', err);
          }
        } else {
          console.log(`Unknown data type ${typeof data}`);
        }
      });
    });

    server.on('upgrade', async (req: http.IncomingMessage, socket: Socket, upgradeHead: Buffer) => {
      const res = new http.ServerResponse(req) as WsServerResponse;
      res.assignSocket(socket);

      const head = Buffer.alloc(upgradeHead.length);
      upgradeHead.copy(head);

      res.on('finish', () => {
        res.socket.destroy();
      });

      res.acceptUser = (user: User & Document) => new Promise<void>((resolve) => {
        wss.handleUpgrade(req, socket, head, (ws: WebSocketWithBeeJee) => {
          ws.user = user;
          wss.emit('connection', ws);
          resolve();
        });
      });

      return app(req, res);
    });

    const interval = setInterval(() => {
      wss.clients.forEach((ws: WebSocketWithBeeJee): void => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping(() => { });
      });
    }, 30000);

    wss.on('close', () => {
      clearInterval(interval);
    });
  }

  public subscribeToWs({ ws }: WsContext) {
    const { user } = ws;

    ws.on(Actions.ENTER_NOTE, async (payload) => {
      if (!user) {
        return;
      }
      if (!payload._id) {
        return;
      }
      this.webSocketService.addNoteWebSocket(payload._id, ws);
    });

    ws.on(Actions.USER_LEFT, ({ _id }) => {
      this.webSocketService.removeWebSocketInNote(_id, ws);
    });

    ws.on('close', () => {
      this.webSocketService.getNoteWebSockets().forEach((_, id) => {
        this.webSocketService.removeWebSocketInNote(id, ws);
      });
    });
  }

  private initialiseRoutes() {
    this.router.use(`${this.path}`, authMiddleware, (req: RequestWithUser, res: Response, next: NextFunction) => {
      if (isWsServerResponse(res)) {
        res.acceptUser(req.user);
        return;
      }
      next(new HttpException(500, 'res is not WsServerResponse'));
    });
  }
}

export default WebSocketController;
