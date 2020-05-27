import * as express from 'express';
import { Application } from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import { dummyRouter } from './dummy/dummy.router';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.boot();
  }

  private boot() {
    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(cors());

    this.app.use('/dummy', dummyRouter);
  }
}

export default new App().app;
