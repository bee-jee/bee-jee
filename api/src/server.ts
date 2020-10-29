import 'core-js/proposals/reflect-metadata';
import 'dotenv/config';
import { container } from 'tsyringe';
import App from './app';
import NoteController from './note/note.controller';
import AuthenticationController from './authentication/authentication.controller';
import UserController from './user/user.controller';
import CursorController from './cursor/cursor.controller';
import ConfigService from './config/config.service';
import WebSocketController from './websocket/websocket.controller';

require('source-map-support').install();

const make = container.resolve.bind(container);

const app = new App(make(ConfigService), [
  make(WebSocketController),
  make(NoteController),
  make(AuthenticationController),
  make(UserController),
  make(CursorController),
]);
app.listen();
