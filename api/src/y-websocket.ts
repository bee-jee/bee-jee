import http from 'http';
import WebSocket from 'ws';
// @ts-ignore
import { getYDoc, getPersistence, docs } from 'y-websocket/bin/utils';
// @ts-ignore
import * as awarenessProtocol from 'y-protocols/dist/awareness.cjs';
// @ts-ignore
import * as syncProtocol from 'y-protocols/dist/sync.cjs';
// @ts-ignore
import * as encoding from 'lib0/dist/encoding.cjs';
// @ts-ignore
import * as decoding from 'lib0/dist/decoding.cjs';
import { Socket } from 'net';
import { container } from 'tsyringe';
import {
  Application,
  Response,
  NextFunction,
} from 'express';
import RequestWithUser from './interfaces/requestWithUser.interface';
import { authMiddleware } from './middleware/auth.middleware';
import { isWsServerResponse, WsServerResponse } from './websocket/websocket.interface';
import HttpException from './exceptions/HttpException';
import { Colors } from '../../common/collab';

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

const messageSync = 0;
const messageAwareness = 1;

const closeConn = (doc: any, conn: WebSocket) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
    const persistence = getPersistence();
    if (doc.conns.size === 0 && persistence !== null) {
      // if persisted, we store state and destroy ydocument
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });
      docs.delete(doc.name);
    }
  }
  conn.close();
};

const send = (doc: any, conn: WebSocket, m: Uint8Array) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn);
  }
  try {
    conn.send(m, (err) => err != null && closeConn(doc, conn));
  } catch (e) {
    closeConn(doc, conn);
  }
};

const messageListener = (conn: WebSocket, doc: any, message: Uint8Array) => {
  const encoder = encoding.createEncoder();
  const decoder = decoding.createDecoder(message);
  const messageType = decoding.readVarUint(decoder);
  switch (messageType) {
    case messageSync:
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.readSyncMessage(decoder, encoder, doc, null);
      if (encoding.length(encoder) > 1) {
        send(doc, conn, encoding.toUint8Array(encoder));
      }
      break;
    case messageAwareness: {
      const update = decoding.readVarUint8Array(decoder);
      const updateDecoder = decoding.createDecoder(update);
      const updateEncoder = encoding.createEncoder();
      const len = decoding.readVarUint(updateDecoder);
      const states = doc.awareness.getStates();
      encoding.writeVarUint(updateEncoder, len);

      for (let i = 0; i < len; i++) {
        const clientID = decoding.readVarUint(updateDecoder);
        const clock = decoding.readVarUint(updateDecoder);
        const state = JSON.parse(decoding.readVarString(updateDecoder));
        const currentState = states.get(clientID);
        const modifiedState = {
          ...state,
          user: currentState ? currentState.user || {} : {},
        };
        encoding.writeVarUint(updateEncoder, clientID);
        encoding.writeVarUint(updateEncoder, clock);
        encoding.writeVarString(updateEncoder, JSON.stringify(modifiedState));
      }

      const modifiedUpdate = encoding.toUint8Array(updateEncoder);
      awarenessProtocol.applyAwarenessUpdate(doc.awareness, modifiedUpdate, conn);
      break;
    }
    default:
      break;
  }
};

const pingTimeout = 30000;

const setupWSConnection = (
  conn: WebSocket,
  req: RequestWithUser,
  { docName = req.params.id, gc = true } = {},
) => {
  conn.binaryType = 'arraybuffer';
  // get doc, initialize if it does not exist yet
  const doc = getYDoc(docName, gc);
  if (!doc.colorCounter) {
    doc.colorCounter = 0;
  }
  doc.colorCounter++;
  doc.conns.set(conn, new Set());
  // listen and reply to events
  conn.on('message', (message) => messageListener(conn, doc, new Uint8Array(message as ArrayBuffer)));

  // Check if connection is still alive
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);
  conn.on('close', () => {
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });
  conn.on('pong', () => {
    pongReceived = true;
  });
  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(doc, conn, encoding.toUint8Array(encoder));
    doc.awareness.on('change', ({ added }: { added: Array<number> }) => {
      const states = doc.awareness.getStates();
      added.forEach((clientId) => {
        const state = states.get(clientId);

        if (state) {
          state.user = {
            name: req.user.fullName || '',
            initials: req.user.initials || '',
            color: Colors[doc.colorCounter % Colors.length],
          };
          states.set(clientId, state);
        }
      });

      awarenessProtocol.applyAwarenessUpdate(doc.awareness,
        awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(states.keys())), 'local');
    });
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, messageAwareness);
      encoding.writeVarUint8Array(awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
      send(doc, conn, encoding.toUint8Array(awarenessEncoder));
    }
  }
};

const initialiseYWebsocket = (server: http.Server): WebSocket.Server => {
  const wss = new WebSocket.Server({ noServer: true });
  const app = container.resolve<Application>('app');

  app.use('/ws/:id', authMiddleware, (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (isWsServerResponse(res)) {
      res.acceptRequest(req);
      return;
    }
    next(new HttpException(500, 'res is not WsServerResponse'));
  });

  server.on('upgrade', async (req: http.IncomingMessage, socket: Socket, upgradeHead: Buffer) => {
    const res = new http.ServerResponse(req) as WsServerResponse;
    res.assignSocket(socket);

    const head = Buffer.alloc(upgradeHead.length);
    upgradeHead.copy(head);

    res.on('finish', () => {
      res.socket.destroy();
    });

    res.acceptRequest = (request: RequestWithUser) => new Promise<void>((resolve) => {
      wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        wss.emit('connection', ws, request);
        resolve();
      });
    });

    return app(req, res);
  });

  wss.on('connection', setupWSConnection);

  return wss;
};

export default initialiseYWebsocket;
