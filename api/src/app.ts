import * as express from 'express';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as WebSocket from 'ws';
import * as http from 'http';
import { Controller, isWsController } from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';

class App {
  public app: express.Application;

  public server: http.Server;

  public wss: WebSocket.Server;

  constructor(public controllers: Controller[]) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.boot(controllers);
  }

  public listen() {
    this.server.listen(process.env.API_PORT, () => {
      console.log(`API is listening on ${process.env.API_PORT}`);
    });
  }

  private boot(controllers: Controller[]) {
    const {
      MONGO_USER,
      MONGO_PASSWORD,
      MONGO_PATH,
    } = process.env;
    let uri = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`;
    if (typeof MONGO_USER === 'undefined' || MONGO_USER === '') {
      uri = `mongodb://${MONGO_PATH}`;
    }
    mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
      this.app.use('/', controller.router);
    });
  }

  private initialiseErrorHandler() {
    this.app.use(errorMiddleware);
  }

  private initialiseWebsocketServer() {
    this.wss = new WebSocket.Server({
      server: this.server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', async (data: WebSocket.Data) => {
        /* eslint-disable no-await-in-loop */
        if (typeof data === 'string') {
          const payload = JSON.parse(data);
          for (let i = 0; i < this.controllers.length; i += 1) {
            const controller = this.controllers[i];
            if (isWsController(controller)) {
              if (await Promise.resolve(controller.handleWsMessage({
                wss: this.wss,
                data: payload,
                ws,
              }))) {
                break;
              }
            }
          }
        }
      });
    });
  }
}

export default App;
