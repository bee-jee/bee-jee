import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import WebSocket from 'ws';
import http from 'http';
import { CleanEnv } from 'envalid';
import * as path from 'path';
import { Controller, isWsController, WsContext } from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';
import { WebsocketWithBeeJee } from './interfaces/websocket.interface';
import ConfigManager from './interfaces/config.interface';

export const ROOT_DIR = path.resolve(__dirname, '..', '..');

class App implements ConfigManager {
  public app: express.Application;

  public server: http.Server;

  public wss: WebSocket.Server;

  public static noteWebsockets = new Map<string, Set<WebSocket>>();

  constructor(public config: Readonly<{
    MONGO_USER: string;
    MONGO_PASSWORD: string;
    MONGO_PATH: string;
    API_PORT: number;
    OAUTH_CLIENT_ID: string;
    OAUTH_CLIENT_SECRET: string;
  }> & CleanEnv & {
    readonly [varName: string]: string | undefined
  }, public controllers: Controller[]) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.boot(controllers);
  }

  public listen() {
    this.server.listen(this.config.API_PORT, () => {
      console.log(`API is listening on ${this.config.API_PORT}`);
    });
  }

  public get(key: string): string | undefined {
    return this.config[key];
  }

  private boot(controllers: Controller[]) {
    const {
      MONGO_USER,
      MONGO_PASSWORD,
      MONGO_PATH,
    } = this.config;
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
      controller.boot(this);
      this.app.use('/', controller.router);
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

    wss.on('connection', (ws: WebsocketWithBeeJee) => {
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

      ws.on('pong', function heartbeat(this: WebsocketWithBeeJee) {
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
      wss.clients.forEach((ws: WebsocketWithBeeJee): void => {
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
