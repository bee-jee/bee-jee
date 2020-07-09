import 'dotenv/config';
import validateEnv from './utils/env';
import App from './app';
import NoteController from './note/note.controller';
import AuthenticationController from './authentication/authentication.controller';
import UserController from './user/user.controller';

require('source-map-support').install();

validateEnv();
const app = new App([
  new NoteController(),
  new AuthenticationController(),
  new UserController(),
]);
app.listen();
