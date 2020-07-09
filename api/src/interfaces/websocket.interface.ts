import * as WebSocket from 'ws';

interface WebsocketWithBeeJee extends WebSocket {
  isAlive?: boolean;
  isAuthenticated?: boolean;
}

export default WebsocketWithBeeJee;
