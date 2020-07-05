import { Document, Model } from 'mongoose';
import * as Automerge from 'automerge';

enum ContentType {
  HTML = 'html',
  MarkDown = 'markdown',
}

export interface Note {
  title: string;
  content: string;
  contentType: ContentType,
  drawings: string[];
  created: Date;
  updated: Date;
}

export interface PendingNote {
  note: Note & Document;
  content: Automerge.FreezeObject<unknown>;
  isDirty: boolean;
}

export function pendingNote(note: (Note & Document) | null): PendingNote | null {
  if (note === null) {
    return null;
  }
  return {
    note,
    content: Automerge.load(note.content),
    isDirty: false,
  };
}

export async function saveContent(model: Model<Note & Document, {}>,
  pending: PendingNote | null): Promise<void> {
  if (pending === null) {
    return;
  }
  if (!pending.isDirty) {
    return;
  }
  const { note } = pending;
  const newPending = pending;
  newPending.isDirty = false;
  note.content = Automerge.save(pending.content);
  await model.updateOne({ _id: pending.note._id },
    { content: note.content }, { upsert: true });
}
