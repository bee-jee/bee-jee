import * as decoding from 'lib0/decoding';
import {
  messageAwarenessUserInfo,
  messageSync,
  messageSyncEnd,
} from '../../common/collab';

export const withBeeJeeWs = (
  provider, awareness, currHandler = provider.ws.onmessage,
) => (event) => {
  const decoder = decoding.createDecoder(new Uint8Array(event.data));
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case messageAwarenessUserInfo: {
      awareness.setLocalStateField(
        decoding.readVarString(decoder),
        JSON.parse(decoding.readVarString(decoder)),
      );
      break;
    }
    case messageSyncEnd:
      provider.emit('endSyncing', []);
      break;
    default:
      if (messageType === messageSync) {
        provider.emit('startSyncing', []);
      }

      currHandler(event);
      break;
  }
};
