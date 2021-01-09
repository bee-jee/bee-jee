import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import * as path from 'path';
import { container } from 'tsyringe';
import { Controller } from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';
import ConfigService from './config/config.service';

export const ROOT_DIR = path.resolve(__dirname, '..', '..');

class App {
  public app: express.Application;

  public server: http.Server;

  constructor(public configService: ConfigService, public controllers: Controller[]) {
    this.app = express();
    this.server = http.createServer(this.app);

    container.register<express.Application>('app', { useValue: this.app });
    container.register<http.Server>('server', { useValue: this.server });
    container.register<Controller[]>('controllers', { useValue: controllers });

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
      useCreateIndex: true,
    });
    this.initialiseMiddlewares();
    this.initialiseControllers(controllers);
    this.initialiseErrorHandler();
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
}

export default App;
