import Vue from 'vue';
import Vuex from 'vuex';
import config from './modules/config';
import notes from './modules/notes';
import auth from './modules/auth';
import cursors from './modules/cursors';
import user from './modules/user';
import app from './modules/app';
import tiptap from './modules/tiptap';
import notification from './modules/notification';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    notes,
    config,
    auth,
    cursors,
    user,
    app,
    tiptap,
    notification,
  },
});

export default store;
