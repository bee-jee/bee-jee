import { Schema, model, Document } from 'mongoose';
import { UserSharedNote } from './share.interface';

const userSharedNoteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  note: { type: Schema.Types.ObjectId, ref: 'Note' },
  permission: String,
  isViewed: {
    type: Boolean,
    default: false,
  },
});

const UserSharedNoteModel = model<UserSharedNote & Document>('UserSharedNote', userSharedNoteSchema);

export default UserSharedNoteModel;
