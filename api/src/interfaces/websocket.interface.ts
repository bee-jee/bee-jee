import WebSocket from 'ws';
import { Document } from 'mongoose';
import { User } from '../user/user.interface';

interface WebsocketWithBeeJee extends WebSocket {
  isAlive?: boolean;
  isAuthenticated?: boolean;
  user?: User & Document;
  cursorIds?: Map<string, string>;
}

export default WebsocketWithBeeJee;
