import { Document } from 'mongoose';
import { Visibility, UserSharedNote } from '../share/share.interface';

export interface Note {
  author: string;
  title: string;
  content: string | undefined;
  visibility: Visibility,
  sharedUsers: (UserSharedNote & Document)[] | undefined;
  created: Date;
  updated: Date;
}

export interface PendingNote {
  note: Note & Document;
}

export function pendingNote(note: (Note & Document) | null): PendingNote | null {
  if (note === null) {
    return null;
  }
  return {
    note,
  };
}
