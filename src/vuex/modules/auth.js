import Vue from 'vue';
import Cookie from 'js-cookie';

const state = {
  user: {},
  token: Cookie.get('token') || '',
  refreshToken: Cookie.get('refreshToken') || '',
};

const getters = {
  user: state => state.user,
  isLoggedIn: state => !!state.user._id,
  token: state => state.token,
  refreshToken: state => state.refreshToken,
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
      commit('setToken', resp.data.accessToken);
      commit('setRefreshToken', resp.data.accessToken);
      commit('setUser', resp.data.user);
      wsAuthenticate(getters.token);
    } catch (err) {
      console.error(err);
    }
  },
  async logout({ commit }) {
    Vue.prototype.$http.post('/auth/logout');
    commit('setUser', {});
    commit('setToken', '');
    commit('setRefreshToken', '');
    commit('setIsAuthenticated', false);
  },
  async checkLoggedIn({ commit, getters, dispatch }) {
    const finaliseUser = (user) => {
      commit('setUser', user);
      // If the ws is connected before we got the response from the server
      // then we want to do ws authentication here. Because onSocketOpen has
      // not authenticate due to not being logged in
      if (user._id) {
        if (getters.websocketIsConnected) {
          wsAuthenticate(getters.token);
        }
      } else {
        dispatch('logout');
      }
    };
    const tryRefreshToken = async () => {
      if (getters.refreshToken) {
        try {
          const resp = await Vue.prototype.$http.post('/auth/refreshToken', {
            refreshToken: getters.refreshToken,
          });
          commit('setToken', resp.data.accessToken);
          commit('setRefreshToken', resp.data.accessToken);
          commit('setUser', resp.data.user);
          wsAuthenticate(getters.token);
        } catch(err) {
          dispatch('logout');
        }
        return;
      }
      dispatch('logout');
    };
    try {
      const resp = await Vue.prototype.$http.get(`/auth/user`);
      finaliseUser(resp.data);
    } catch (err) {
      tryRefreshToken();
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
    Vue.prototype.$http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  setRefreshToken(state, token) {
    state.refreshToken = token;
    Cookie.set('refreshToken', token, {
      sameSite: true,
      secure: process.env.NODE_ENV === 'production',
    });
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
