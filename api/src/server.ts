import 'dotenv/config';
import validateEnv from './utils/env';
import App from './app';
import NoteController from './note/note.controller';

validateEnv();
const app = new App([
  new NoteController(),
]);
app.listen();
