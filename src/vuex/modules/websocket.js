import Vue from 'vue';
import pako from 'pako';
import Automerge from 'automerge';

export const state = {
  socket: {
    isConnected: false,
    reconnectError: false,
  },
};

export const getters = {

};

export const actions = {
  contentUpdated({ getters, commit }, data) {
    const { id, content } = data.payload;
    const note = getters.noteById(id);
    if (note !== null) {
      const currContent = note.content;
      const decompressed = pako.inflate(content, { to: 'string' });
      if (decompressed !== null) {
        const newContent = Automerge.load(decompressed);
        note.content = Automerge.merge(currContent, newContent);
      }
      commit('NOTE_EDITOR', note);
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
