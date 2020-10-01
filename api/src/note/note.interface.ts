import { Document } from 'mongoose';
import WebSocket from 'ws';
import { Doc } from 'yjs';
import { Visibility, UserSharedNote } from '../share/share.interface';

export interface Note {
  author: any;
  title: string;
  content: string | undefined;
  visibility: Visibility,
  sharedUsers: (UserSharedNote & Document)[] | undefined;
  created: Date;
  updated: Date;
}

export interface WSSharedNote {
  note: Note & Document;
  content: Doc | null;
  conns: Set<WebSocket>;
}
