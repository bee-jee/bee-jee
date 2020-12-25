import * as decoding from 'lib0/decoding';
import { messageAwarenessUserInfo } from '../../common/collab';

export const withBeeJeeAwareness = (awareness, currHandler) => (event) => {
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
    default:
      currHandler(event);
      break;
  }
};
