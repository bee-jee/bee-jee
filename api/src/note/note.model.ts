import { Schema, model, Document } from 'mongoose';
import { Note } from './note.interface';

const noteSchema = new Schema({
  title: String,
  content: String,
  created: Date,
  updated: {
    type: Date,
    default: Date.now,
  },
});

export const NoteModel = model<Note & Document>('Note', noteSchema);
