import Vue from 'vue';
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
    const { id, mergeChanges } = data.payload;
    const note = getters.noteById(id);
    if (note !== null) {
      const changes = JSON.parse(mergeChanges);
      if (changes !== null) {
        const currContent = note.content;
        note.content = Automerge.applyChanges(currContent, changes);
        commit('NOTE_EDITOR', {
          note,
          currContent,
          changes: changes,
        });
      }
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
