import Vue from 'vue';
import * as Y from 'yjs';
import { stringToArray } from '../../../common/collab';

export const state = {
  socket: {
    isConnected: false,
    reconnectError: false,
  },
};

export const getters = {

};

export const actions = {
  contentUpdated({ commit, getters }, data) {
    const { id, mergeChanges } = data.payload;
    const note = getters.noteById(id);
    if (note && note._id) {
      const changes = stringToArray(mergeChanges);
      Y.applyUpdate(note.content, changes, 'ws');
      commit('setNoteContent', note);
    }
  },
};

export const mutations = {
  SOCKET_ONOPEN(state, event)  {
    Vue.prototype.$socket = event.currentTarget
    state.socket.isConnected = true
  },
  SOCKET_ONCLOSE(state)  {
    state.socket.isConnected = false
  },
  SOCKET_ONERROR(state, event)  {
    console.error(state, event)
  },
  // default handler called for all methods
  SOCKET_ONMESSAGE(state, message)  {
    console.log(`Unhandled message: ${message}`);
  },
  // mutations for reconnect methods
  SOCKET_RECONNECT(state, count) {
    console.info(state, count)
  },
  SOCKET_RECONNECT_ERROR(state) {
    state.socket.reconnectError = true;
  },
  NOTE_EDITOR() {},
};

export default {
  state,
  getters,
  actions,
  mutations,
}
