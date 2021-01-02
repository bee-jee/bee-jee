import 'core-js/proposals/reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import App from './app';
import NoteController from './note/note.controller';
import AuthenticationController from './authentication/authentication.controller';
import UserController from './user/user.controller';
import ConfigService from './config/config.service';

require('source-map-support').install();

const make = container.resolve.bind(container);

const config = make(ConfigService);

process.env.YPERSISTENCE = config.get('NOTE_CONTENT_PATH');

const app = new App(config, [
  make(NoteController),
  make(AuthenticationController),
  make(UserController),
]);

require('./y-websocket').install(app.server);

app.listen();
