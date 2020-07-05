import 'dotenv/config';
import validateEnv from './utils/env';
import App from './app';
import NoteController from './note/note.controller';

require('source-map-support').install();

validateEnv();
const app = new App([
  new NoteController(),
]);
app.listen();
