import * as express from 'express';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import Controller from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';

class App {
  public app: express.Application;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.boot(controllers);
  }

  public listen() {
    this.app.listen(process.env.API_PORT, () => {
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
}

export default App;
