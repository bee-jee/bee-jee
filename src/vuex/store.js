import Vue from 'vue';
import Vuex from 'vuex';
import config from './modules/config';
import notes from './modules/notes';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    notes,
    config,
  },
});

export default store;
