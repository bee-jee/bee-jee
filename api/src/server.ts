import 'dotenv/config';
import validateEnv from './utils/env';
import App from './app';
import NoteController from './note/note.controller';
import AuthenticationController from './authentication/authentication.controller';
import UserController from './user/user.controller';
import CursorController from './cursor/cursor.controller';

require('source-map-support').install();

const config = validateEnv();
const app = new App(config, [
  new NoteController(),
  new AuthenticationController(),
  new UserController(),
  new CursorController(),
]);
app.listen();
