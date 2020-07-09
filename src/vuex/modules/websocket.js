import Vue from 'vue';
import * as Y from 'yjs';
import { stringToArray } from '../../../common/collab';
import { wsAuthenticate } from './auth';

export const state = {
  socket: {
    isConnected: false,
    isAuthenticated: false,
    reconnectError: false,
  },
};

export const getters = {
  websocketIsConnected: state => state.socket.isConnected,
  websocketIsAuthenticated: state => state.socket.isAuthenticated,
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
  authenticated({ commit }, data) {
    if (data.payload.status === 200) {
      commit('setIsAuthenticated', true);
    }
  },
  onSocketOpen({ getters }) {
    // If the ws is open after we got the response from server
    // saying we are authenticated, then we will need to do ws
    // authentication here
    if (getters.isLoggedIn) {
      wsAuthenticate(getters.token);
    }
  },
};

export const mutations = {
  SOCKET_ONOPEN(state, event) {
    Vue.prototype.$socket = event.currentTarget
    state.socket.isConnected = true;
  },
  SOCKET_ONCLOSE(state) {
    state.socket.isConnected = false;
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
    state.socket.reconnectError = true;
  },
  setIsAuthenticated(state, value) {
    state.socket.isAuthenticated = value;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
}
