import { Schema, model, Document } from 'mongoose';
import { Note } from './note.interface';
import { Visibility } from '../share/share.interface';

const noteSchema = new Schema({
  author: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  title: String,
  content: String,
  guestAccess: {
    type: Boolean,
    default: undefined,
  },
  visibility: {
    type: String,
    default: Visibility.Private,
  },
  parent: {
    ref: 'Note',
    type: Schema.Types.ObjectId,
    default: undefined,
  },
  path: {
    type: String,
    default: undefined,
  },
  created: Date,
  updated: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: {
    virtuals: true,
  },
});

noteSchema.virtual('sharedUsers', {
  ref: 'UserSharedNote',
  localField: '_id',
  foreignField: 'note',
});

noteSchema.virtual('children', {
  red: 'Note',
  localField: 'parent',
  foreignField: '_id',
});

const NoteModel = model<Note & Document>('Note', noteSchema);

export default NoteModel;
