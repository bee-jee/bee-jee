import http from 'http';
import WebSocket from 'ws';
// @ts-ignore
import { getYDoc as getYDocOrCreate, getPersistence, docs } from 'y-websocket/bin/utils';
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
import { Document } from 'mongoose';
import RequestWithUser from './interfaces/requestWithUser.interface';
import { isWsServerResponse, WsServerResponse } from './websocket/websocket.interface';
import HttpException from './exceptions/HttpException';
import { Colors, messageAwarenessUserInfo, messageSyncEnd } from '../../common/collab';
import { guestIfAvailableMiddleware } from './middleware/visibility.middleware';
import { User } from './user/user.interface';

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

const messageSync = 0;
const messageAwareness = 1;

type UserInfo = {
  id: string;
  name: string;
  color: string;
  initials: string;
};

const updateDocAwareness = (doc: any) => {
  doc.awareness.setLocalState({
    isServer: true,
    users: Array.from(doc.clientUserMap.values()).reduce((users: any, info: any) => {
      users[info.id] = info;
      return users;
    }, {}),
  });
};

const addUser = (doc: any, conn: WebSocket, userInfo: UserInfo) => {
  doc.clientUserMap.set(conn, userInfo);
  updateDocAwareness(doc);
};

const removeUser = (doc: any, conn: WebSocket) => {
  doc.clientUserMap.delete(conn);
  updateDocAwareness(doc);
};

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
  if (doc.clientUserMap) {
    removeUser(doc, conn);
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

const useSendAck = () => {
  const ackEncoder = encoding.createEncoder();
  encoding.writeVarUint(ackEncoder, messageSyncEnd);
  const ack = encoding.toUint8Array(ackEncoder);

  return (doc: any, conn: WebSocket) => {
    send(doc, conn, ack);
  };
};

const sendAck = useSendAck();

type MessageHandler = (
  conn: WebSocket,
  user: User & Document | undefined,
  doc: any,
  message: Uint8Array,
) => void;

const withAwareness = (currHandler: MessageHandler) => (
  conn: WebSocket,
  user: User & Document | undefined,
  doc: any,
  message: Uint8Array,
) => {
  const decoder = decoding.createDecoder(message);
  const messageType = decoding.readVarUint(decoder);
  switch (messageType) {
    case messageAwareness: {
      const update = awarenessProtocol.modifyAwarenessUpdate(
        decoding.readVarUint8Array(decoder),
        (state: { cursor: any } | null) => ({
          cursor: (state || {}).cursor,
          user: doc.clientUserMap.get(conn),
        }),
      );
      awarenessProtocol.applyAwarenessUpdate(doc.awareness, update, conn);
      break;
    }
    default:
      currHandler(conn, user, doc, message);
      break;
  }
};

const useDocSyncMessageListener = () => (
  conn: WebSocket, user: User & Document | undefined, doc: any, message: Uint8Array,
) => {
  const encoder = encoding.createEncoder();
  const decoder = decoding.createDecoder(message);
  const messageType = decoding.readVarUint(decoder);
  switch (messageType) {
    case messageSync: {
      encoding.writeVarUint(encoder, messageSync);
      const syncType = decoding.readVarUint(decoder);
      switch (syncType) {
        case syncProtocol.messageYjsSyncStep1:
          syncProtocol.readSyncStep1(decoder, encoder, doc);
          break;
        case syncProtocol.messageYjsSyncStep2:
          if (!user) {
            break;
          }
          syncProtocol.readSyncStep2(decoder, doc, null);
          break;
        case syncProtocol.messageYjsUpdate:
          if (!user) {
            break;
          }
          syncProtocol.readUpdate(decoder, doc, null);
          break;
        default:
          throw new Error('Unknown message type');
      }
      if (encoding.length(encoder) > 1) {
        send(doc, conn, encoding.toUint8Array(encoder));
      }
      sendAck(doc, conn);
      break;
    }
    default:
      break;
  }
};

const sendUserInfo = (doc: any, conn: WebSocket, userInfo: UserInfo) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageAwarenessUserInfo);
  encoding.writeVarString(encoder, 'user');
  encoding.writeVarString(encoder, JSON.stringify(userInfo));
  send(doc, conn, encoding.toUint8Array(encoder));
};

const pingTimeout = 15000;

const setupPingPong = (conn: WebSocket, doc: any) => {
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
};

const sendSyncStep1 = (conn: WebSocket, doc: any) => {
  // send sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  send(doc, conn, encoding.toUint8Array(encoder));
  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
    send(doc, conn, encoding.toUint8Array(awarenessEncoder));
  }
};

const setupNoteWSConnection = (
  conn: WebSocket,
  req: RequestWithUser,
  { docName = req.params.id, gc = true } = {},
) => {
  conn.binaryType = 'arraybuffer';
  const doc = getYDocOrCreate(docName, gc);
  if (!doc.colorCounter) {
    doc.colorCounter = 0;
  }
  if (!doc.clientUserMap) {
    doc.clientUserMap = new Map();
  }
  const userInfo: UserInfo | undefined = req.user ? {
    id: `${req.user._id.toString()}-${doc.colorCounter}`,
    name: req.user.fullName || '',
    color: Colors[doc.colorCounter % Colors.length],
    initials: req.user.initials || '',
  } : undefined;
  doc.colorCounter++;
  if (userInfo) {
    addUser(doc, conn, userInfo);
    sendUserInfo(doc, conn, userInfo);
  }
  doc.conns.set(conn, new Set());

  const messageListener = withAwareness(useDocSyncMessageListener());

  conn.on('message', (message) => messageListener(conn, req.user, doc, new Uint8Array(message as ArrayBuffer)));

  setupPingPong(conn, doc);

  sendSyncStep1(conn, doc);
};

const setupUserPrefWSConnection = (
  conn: WebSocket,
  req: RequestWithUser,
  { docName = 'userPref' } = {},
) => {
  conn.binaryType = 'arraybuffer';
  const doc = getYDocOrCreate(`${req.user._id}-${docName}`, true);
  doc.conns.set(conn, new Set());

  const messageListener = useDocSyncMessageListener();

  conn.on('message', (message) => messageListener(conn, req.user, doc, new Uint8Array(message as ArrayBuffer)));

  setupPingPong(conn, doc);

  sendSyncStep1(conn, doc);
};

const setupWSConnection = (
  conn: WebSocket,
  req: RequestWithUser,
  { docName = req.params.id, gc = true } = {},
) => {
  if (docName === 'userPref') {
    setupUserPrefWSConnection(conn, req);
  } else {
    setupNoteWSConnection(conn, req, { docName, gc });
  }
};

const initialiseYWebsocket = (server: http.Server): WebSocket.Server => {
  const wss = new WebSocket.Server({ noServer: true });
  const app = container.resolve<Application>('app');

  app.use('/ws/:id', guestIfAvailableMiddleware([
    'userPref',
  ]), (req: RequestWithUser, res: Response, next: NextFunction) => {
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

export const install = initialiseYWebsocket;

export default initialiseYWebsocket;
