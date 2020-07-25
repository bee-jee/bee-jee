import Vue from 'vue';
import Vuex from 'vuex';
import config from './modules/config';
import notes from './modules/notes';

Vue.use(Vuex);
//This is to test pull request
const store = new Vuex.Store({
  modules: {
    notes,
    config,
  },
});

export default store;
