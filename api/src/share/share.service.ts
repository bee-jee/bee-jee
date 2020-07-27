import { Document } from 'mongoose';
import { User } from '../user/user.interface';
import { Note } from '../note/note.interface';
import { Permission, UserSharedNote } from './share.interface';
import UserSharedNoteModel from './share.model';

async function saveOrCreateSharedNote(user: User & Document,
  note: Note & Document, permission: Permission): Promise<UserSharedNote & Document> {
  const userSharedNote = await UserSharedNoteModel.findOne({
    user: user._id,
    note: note._id,
  });
  if (userSharedNote !== null) {
    return userSharedNote;
  }
  const newUserSharedNote = new UserSharedNoteModel({
    user: user._id,
    note: note._id,
    permission,
  });
  return newUserSharedNote.save();
}

export default saveOrCreateSharedNote;
