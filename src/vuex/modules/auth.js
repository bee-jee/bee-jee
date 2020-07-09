import Vue from 'vue';
import Cookie from 'js-cookie';

const state = {
  user: {},
  token: Cookie.get('token') || '',
};

const getters = {
  user: state => state.user,
  isLoggedIn: state => !!state.user._id,
  token: state => state.token,
};

export const wsAuthenticate = (token) => {
  Vue.prototype.$socket.send(JSON.stringify({
    action: 'authenticate',
    payload: {
      token: token,
    },
  }));
};

const actions = {
  async login({ commit, getters }, { username, password }) {
    try {
      const resp = await Vue.prototype.$http.post(`/auth/login`, {
        username,
        password,
      });
      commit('setToken', resp.data.token);
      wsAuthenticate(getters.token);
    } catch (err) {
      console.error(err);
    }
  },
  async logout({ commit }) {
    commit('setUser', {});
    commit('setToken', '');
  },
  async checkLoggedIn({ commit, getters }) {
    const resp = await Vue.prototype.$http.get(`/auth/user`);
    commit('setUser', resp.data);
    // If the ws is connected before we got the response from the server
    // then we want to do ws authentication here. Because onSocketOpen has
    // not authenticate due to not being logged in
    if (getters.websocketIsConnected) {
      wsAuthenticate(getters.token);
    }
  },
};

const mutations = {
  setUser(state, user) {
    state.user = user;
  },
  setToken(state, token) {
    state.token = token;
    Cookie.set('token', token, {
      sameSite: true,
      secure: process.env.NODE_ENV === 'production',
    });
    Vue.prototype.$http.defaults.headers.common['Authorization'] = token;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
