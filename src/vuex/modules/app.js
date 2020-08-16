const state = {
  isLoading: false,
  wantsUrl: null,
};

const getters = {
  globalIsLoading: (state) => state.isLoading,
  wantsUrl: (state) => state.wantsUrl,
};

const actions = {
  popWantsUrl({ commit, getters }) {
    const wantsUrl = getters.wantsUrl;
    commit('setWantsUrl', null);
    return wantsUrl;
  },
};

const mutations = {
  setGlobalIsLoading(state, value) {
    state.isLoading = value;
  },
  setWantsUrl(state, url) {
    state.wantsUrl = url;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
