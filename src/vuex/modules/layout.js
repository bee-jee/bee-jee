const state = {
  isLoading: false,
};

const getters = {
  globalIsLoading: (state) => state.isLoading,
};

const actions = {

};

const mutations = {
  setGlobalIsLoading(state, value) {
    state.isLoading = value;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
