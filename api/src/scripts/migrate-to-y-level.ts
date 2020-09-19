import mongoose from 'mongoose';
import 'dotenv/config';
import { LeveldbPersistence } from 'y-leveldb';
import { encodeStateAsUpdate } from 'yjs';
import validateEnv from '../utils/env';
import NoteModel from '../note/note.model';
import { decodeDoc } from '../../../common/collab';
import { buildNoteContentPath } from '../note/noteContent.service';

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_PATH,
  NOTE_CONTENT_PATH,
} = validateEnv();
let uri = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`;
if (typeof MONGO_USER === 'undefined' || MONGO_USER === '') {
  uri = `mongodb://${MONGO_PATH}`;
}

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async (connection) => {
    const notes = await NoteModel.find({});
    const promises: Promise<number>[] = [];
    const yLevel = new LeveldbPersistence(buildNoteContentPath(NOTE_CONTENT_PATH));
    notes.forEach((note) => {
      if (note.content !== undefined) {
        const doc = decodeDoc(note.content);
        promises.push(yLevel.storeUpdate(note._id.toString(), encodeStateAsUpdate(doc)));
      }
    });
    await Promise.all(promises);
    connection.disconnect();
  });
