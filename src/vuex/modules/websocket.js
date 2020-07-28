import * as Y from 'yjs';
import { stringToArray, Actions } from '../../../common/collab';
import { setWs, removeWs } from '../../helpers/ws';

export const state = {
  isConnected: false,
  reconnectError: false,
};

export const getters = {
  websocketIsConnected: state => state.isConnected,
};

export const actions = {
  [Actions.CONTENT_UPDATED]({ commit, getters }, data) {
    const { id, mergeChanges } = data.payload;
    const note = getters.selectedNote;
    if (note._id && note._id === id) {
      const changes = stringToArray(mergeChanges);
      Y.applyUpdate(note.content, changes, 'ws');
      commit('setNoteContent', note);
    }
  },
};

export const mutations = {
  SOCKET_ONOPEN(state, event) {
    setWs(event.currentTarget);
    state.isConnected = true;
  },
  SOCKET_ONCLOSE(state) {
    state.isConnected = false;
    removeWs();
  },
  SOCKET_ONERROR(state, event) {
    console.error(state, event);
  },
  // default handler called for all methods
  SOCKET_ONMESSAGE(state, message) {
    console.log(`Unhandled message: ${message}`);
  },
  // mutations for reconnect methods
  SOCKET_RECONNECT(state, count) {
    console.info(state, count);
  },
  SOCKET_RECONNECT_ERROR(state) {
    state.reconnectError = true;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
}
