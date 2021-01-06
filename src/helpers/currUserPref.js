import * as decoding from 'lib0/decoding';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { messageSyncEnd } from '../../common/collab';

class CurrUserPref extends Y.Doc {
  constructor() {
    super();
    this._selectedNoteType = this.getText('selectedNoteType');
    this._selectedNoteId = this.getText('selectedNoteId');
    this._noteTabIds = this.getMap('noteTabIds');
    this._state = {
      selectedNoteType: '',
      selectedNoteId: '',
      noteTabIds: [],
    };

    this._selectedNoteId.observe(() => {
      this._state.selectedNoteId = this._selectedNoteId.toString();
    });
    this._selectedNoteType.observe(() => {
      this._state.selectedNoteType = this._selectedNoteType.toString();
    });
    this._noteTabIds.observe(() => {
      this._state.noteTabIds = Array.from(this._noteTabIds.entries())
        .sort(([, aOrder], [, bOrder]) => {
          return aOrder - bOrder;
        })
        .map(([id]) => {
          return id;
        });
    });
    this.provider = null;
  }

  get isConnected() {
    return this.provider && this.provider.wsconnected;
  }

  setSelectedNoteType(value) {
    const currValue = this._selectedNoteType.toString();
    if (value !== currValue) {
      this.transact(() => {
        this._selectedNoteType.delete(0, currValue.length);
        this._selectedNoteType.insert(0, value);
      });
    }
  }

  setSelectedNoteId(id) {
    const currId = this._selectedNoteId.toString();
    if (id !== currId) {
      this.transact(() => {
        this._selectedNoteId.delete(0, currId.length);
        this._selectedNoteId.insert(0, id);
      });
    }
  }

  appendNoteTabId(id) {
    this._noteTabIds.set(id, this._noteTabIds.size);
  }

  removeNoteTabId(id) {
    this.transact(() => {
      const deletedOrder = this._noteTabIds.get(id);
      if (deletedOrder !== undefined) {
        this._noteTabIds.forEach((noteId, order) => {
          if (order > deletedOrder) {
            this._noteTabIds.set(noteId, order - 1);
          }
        });
      }
      this._noteTabIds.delete(id);
    });
  }

  connect(token) {
    if (this.isConnected) {
      this.disconnect();
    }

    const provider = new WebsocketProvider(process.env.VUE_APP_WS_URL, 'userPref', this, {
      params: {
        access_token: token,
      },
    });
    // We do not have awareness in this so remove the checking interval, additionally
    // there is already ping pong from the server to check this
    provider._checkInterval = clearInterval(provider._checkInterval);
    provider.on('sync', () => {
      this.emit('sync', [this._state]);
    });
    provider.on('status', ({ status }) => {
      if (status === 'connected') {
        const currHandler = provider.ws.onmessage;
        provider.ws.onmessage = (event) => {
          const decoder = decoding.createDecoder(new Uint8Array(event.data));
          const messageType = decoding.readVarUint(decoder);

          if (messageType === messageSyncEnd) {
            return;
          }

          return currHandler(event);
        };
      }
    });

    this.provider = provider;
  }

  disconnect() {
    if (!this.provider) {
      return;
    }

    this.provider.destroy();
    this.provideer = null;
  }
}

export const currUserPref = new CurrUserPref();
