import Vue from 'vue';
import * as Y from 'yjs';
import { stringToArray, Actions } from '../../../common/collab';
import { wsAuthenticate } from './auth';

export class PendingSocket {
  constructor(store) {
    this.store = store;
  }

  send(data) {
    this.store.commit('SOCKET_ADD_PENDING', data);
  }
}

export const state = {
  isConnected: false,
  isAuthenticated: false,
  reconnectError: false,
  pendingData: [],
};

export const getters = {
  websocketIsConnected: state => state.isConnected,
  websocketIsAuthenticated: state => state.isAuthenticated,
};

export const actions = {
  [Actions.CONTENT_UPDATED]({ commit, getters }, data) {
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
  onSocketOpen({ state, getters, commit }) {
    // If the ws is open after we got the response from server
    // saying we are authenticated, then we will need to do ws
    // authentication here
    if (getters.isLoggedIn) {
      wsAuthenticate(getters.token);
    }
    state.pendingData.forEach((data) => {
      Vue.prototype.$socket.send(data);
    });
    commit('SOCKET_SET_PENDING', []);
  },
};

export const mutations = {
  SOCKET_ADD_PENDING(state, data) {
    state.pendingData.push(data);
  },
  SOCKET_SET_PENDING(state, value) {
    state.pendingData = value;
  },
  SOCKET_ONOPEN(state, event) {
    Vue.prototype.$socket = event.currentTarget;
    state.isConnected = true;
  },
  SOCKET_ONCLOSE(state) {
    state.isConnected = false;
    state.isAuthenticated = false;
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
  setIsAuthenticated(state, value) {
    state.isAuthenticated = value;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
}
