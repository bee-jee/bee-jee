import { autoInjectable } from 'tsyringe';
import { Actions } from '../../../common/collab';
import { WsContext, WsController } from '../interfaces/controller.interface';
import { authWsMiddleware } from '../middleware/auth.middleware';
import { MiddlewareData } from './websocket.interface';
import WebSocketService from './websocket.service';

@autoInjectable()
class WebSocketController implements WsController {
  constructor(private webSocketService: WebSocketService) {}

  public subscribeToWs({ ws }: WsContext) {
    ws.on(Actions.ENTER_NOTE, async (payload) => authWsMiddleware(ws, payload,
      async ({ user }: MiddlewareData) => {
        if (!user) {
          return;
        }
        if (!payload._id) {
          return;
        }
        this.webSocketService.addNoteWebSocket(payload._id, ws);
      }));

    ws.on(Actions.USER_LEFT, ({ _id }) => {
      this.webSocketService.removeWebSocketInNote(_id, ws);
    });

    ws.on('close', () => {
      this.webSocketService.getNoteWebSockets().forEach((_, id) => {
        this.webSocketService.removeWebSocketInNote(id, ws);
      });
    });
  }
}

export default WebSocketController;
