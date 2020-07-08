import * as WebSocket from 'ws';

interface WebsocketWithAlive extends WebSocket {
  isAlive?: boolean;
}

export default WebsocketWithAlive;
