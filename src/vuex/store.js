import Vue from 'vue';
import Vuex from 'vuex';
import config from './modules/config';
import notes from './modules/notes';
import websocket from './modules/websocket';
import auth from './modules/auth';
import cursors from './modules/cursors';
import user from './modules/user';
import app from './modules/app';
import tiptap from './modules/tiptap';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    notes,
    config,
    websocket,
    auth,
    cursors,
    user,
    app,
    tiptap,
  },
});

export default store;
