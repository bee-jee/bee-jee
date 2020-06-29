import lzstring from 'lz-string';

const CONFIG_KEY = 'config';

export const state = {
  explorerSize: 20,
  defaultEditorEditType: 'wysiwyg',
  definitions: [
    {
      type: 'menu',
      name: 'defaultEditorEditType',
      values: ['wysiwyg', 'markdown'],
    },
  ],
};

export const getters = {
  config: (state) => (key) => typeof key === 'undefined' ? state : state[key],
};

export const actions = {
  retrieveConfig({ commit }) {
    let config = {};
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      config = JSON.parse(lzstring.decompress(saved));
    }
    commit('setConfig', config);
  },
  setConfig({ getters, commit }, { key, value }) {
    const config = getters.config();
    if (key in config) {
      config[key] = value;
      localStorage.setItem(CONFIG_KEY, lzstring.compress(JSON.stringify(config)));
    }
    commit('setConfig', config);
  },
};

export const mutations = {
  setConfig(state, config) {
    for (const key in config) {
      if (key in state) {
        state[key] = config[key];
      }
    }
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
