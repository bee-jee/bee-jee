import { Schema, model, Document } from 'mongoose';
import { Note } from './note.interface';

const noteSchema = new Schema({
  author: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  title: String,
  content: String,
  contentType: String,
  created: Date,
  updated: {
    type: Date,
    default: Date.now,
  },
});

const NoteModel = model<Note & Document>('Note', noteSchema);

export default NoteModel;
