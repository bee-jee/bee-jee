import Vue from 'vue';
import Vuex from 'vuex';
import config from './modules/config';
import notes from './modules/notes';
import websocket from './modules/websocket';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    notes,
    config,
    websocket,
  },
});

export default store;
