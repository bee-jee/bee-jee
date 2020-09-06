import { Document, Model } from 'mongoose';
import Y from 'yjs';
import { decodeDoc, encodeDoc } from '../../../common/collab';
import { Visibility, UserSharedNote } from '../share/share.interface';

export interface Note {
  author: string;
  title: string;
  content: string;
  visibility: Visibility,
  sharedUsers: (UserSharedNote & Document)[] | undefined;
  created: Date;
  updated: Date;
}

export interface PendingNote {
  note: Note & Document;
  content: Y.Doc;
}

export function pendingNote(note: (Note & Document) | null): PendingNote | null {
  if (note === null) {
    return null;
  }
  return {
    note,
    content: decodeDoc(note.content),
  };
}

export async function saveContent(model: Model<Note & Document, {}>,
  pending: PendingNote | null): Promise<void> {
  if (pending === null) {
    return;
  }
  const { note } = pending;
  note.content = encodeDoc(pending.content);
  await model.updateOne({ _id: pending.note._id }, {
    content: note.content,
    updated: new Date(),
  }, { upsert: true });
}
