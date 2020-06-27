import { Schema, model, Document } from 'mongoose';
import { Note } from './note.interface';

const noteSchema = new Schema({
  title: String,
  content: String,
  drawings: [String],
  created: Date,
  updated: {
    type: Date,
    default: Date.now,
  },
});

const NoteModel = model<Note & Document>('Note', noteSchema);

export default NoteModel;
