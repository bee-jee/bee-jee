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
  visibility: {
    type: String,
    default: Visibility.Private,
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

const NoteModel = model<Note & Document>('Note', noteSchema);

export default NoteModel;
