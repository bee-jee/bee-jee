import WebSocket from 'ws';

export interface BroadcastOptions {
  except?: WebSocket;
}

export default function broadcast(
  wss: WebSocket.Server, msg: string, opts?: BroadcastOptions,
): void {
  const except: WebSocket | null = typeof opts !== 'undefined' ? opts.except || null : null;
  wss.clients.forEach((ws: WebSocket) => {
    if (ws === except) {
      return;
    }
    ws.send(msg);
  });
}
