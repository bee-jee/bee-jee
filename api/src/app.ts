import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import WebSocket from 'ws';
import http from 'http';
import * as path from 'path';
import { Controller, isWsController, WsContext } from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';
import { WebSocketWithBeeJee } from './websocket/websocket.interface';
import ConfigService from './config/config.service';

export const ROOT_DIR = path.resolve(__dirname, '..', '..');

class App {
  public app: express.Application;

  public server: http.Server;

  public wss: WebSocket.Server;

  constructor(public configService: ConfigService, public controllers: Controller[]) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.boot(controllers);
  }

  public listen() {
    this.server.listen(this.configService.get('API_PORT'), () => {
      console.log(`API is listening on ${this.configService.get('API_PORT')}`);
    });
  }

  private boot(controllers: Controller[]) {
    const {
      MONGO_USER,
      MONGO_PASSWORD,
      MONGO_PATH,
    } = this.configService.config;
    let uri = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`;
    if (typeof MONGO_USER === 'undefined' || MONGO_USER === '') {
      uri = `mongodb://${MONGO_PATH}`;
    }
    mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    this.initialiseMiddlewares();
    this.initialiseControllers(controllers);
    this.initialiseErrorHandler();
    this.initialiseWebsocketServer();
  }

  private initialiseMiddlewares() {
    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(cors());
  }

  private initialiseControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      if ('boot' in controller) {
        controller.boot();
      }
      if ('router' in controller) {
        this.app.use('/', controller.router);
      }
    });
  }

  private initialiseErrorHandler() {
    this.app.use(errorMiddleware);
  }

  private initialiseWebsocketServer() {
    const wss = new WebSocket.Server({
      server: this.server,
      path: '/ws',
    });

    wss.on('connection', (ws: WebSocketWithBeeJee) => {
      ws.isAlive = true;

      const wsContext: WsContext = {
        wss: this.wss,
        ws,
      };
      this.controllers.forEach((controller) => {
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

    this.wss = wss;
  }
}

export default App;
