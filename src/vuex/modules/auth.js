import Cookie from 'js-cookie';
import Axios from 'axios';

const env = {
  VUE_APP_IS_HTTPS: process.env.VUE_APP_IS_HTTPS === '1' || process.env.VUE_APP_IS_HTTPS === 'true',
};

const state = {
  user: {},
  token: Cookie.get('token') || '',
  refreshToken: Cookie.get('refreshToken') || '',
  loginError: '',
  loginErrorResponse: {},
  logoutSource: 'user',
  isLoggingIn: false,
  isFinishedRefreshingAuth: false,
};

const getters = {
  user: state => state.user,
  isLoggedIn: state => !!state.user._id,
  isFinishedRefreshingAuth: state => state.isFinishedRefreshingAuth,
  token: state => state.token,
  refreshToken: state => state.refreshToken,
  loginError: state => state.loginError,
  loginErrorResponse: state => state.loginErrorResponse,
  logoutSource: state => state.logoutSource,
  isLoggingIn: state => state.isLoggingIn,
};

const actions = {
  async login({ commit }, { username, password }) {
    commit('setIsLoggingIn', true);
    try {
      const resp = await Axios.post(`/auth/login`, {
        username,
        password,
      }, {
        skipAuthRefresh: true,
      });
      commit('setToken', resp.data.accessToken);
      commit('setRefreshToken', resp.data);
      commit('setUser', resp.data.user);
    } catch (err) {
      if (err.response) {
        commit('setLoginErrorResponse', err.response.data);
        commit('setLoginError', err.response.data.message);
      } else {
        console.error(err);
        commit('setLoginError', err.message);
      }
    } finally {
      commit('setIsLoggingIn', false);
    }
  },
  async logout({ commit }, source) {
    if (source === undefined) {
      source = 'user';
    }
    commit('setLogoutSource', source);
    try {
      await Axios.post('/auth/logout', {}, { skipAuthRefresh: true });
    } catch (err) {
      console.error(err);
    }
    commit('setUser', {});
    commit('setToken', '');
    commit('setRefreshToken', '');
  },
  async refreshToken({ getters, commit }) {
    try {
      const { data } = await Axios.post('/auth/refreshToken', {
        refreshToken: getters.refreshToken,
      }, { skipAuthRefresh: true });
      commit('setToken', data.accessToken);
      commit('setRefreshToken', data);
      commit('setUser', data.user);
    } catch (err) {
      commit('setLogoutSource', 'API');
      commit('setToken', '');
      commit('setRefreshToken', '');
      commit('setUser', {});

      throw err;
    }
  },
  async retrieveUser({ getters, commit }) {
    if (getters.token) {
      try {
        const { data } = await Axios.get('/auth/user');
        commit('setUser', data);
      } catch (err) {
        commit('setUser', {});
      }
    }
  },
};

const cookieOptions = {
  sameSite: 'strict',
  secure: env.VUE_APP_IS_HTTPS,
};

const mutations = {
  setUser(state, user) {
    state.user = user;
  },
  setToken(state, token) {
    state.token = token;
    if (token) {
      Cookie.set('token', token, cookieOptions);
    } else {
      Cookie.remove('token');
    }
  },
  setRefreshToken(state, token) {
    let expires = undefined;
    if (typeof token === 'object') {
      if ('refreshTokenExpiresAt' in token) {
        expires = new Date(token.refreshTokenExpiresAt);
      }
      token = token.refreshToken;
    }
    state.refreshToken = token;
    Cookie.set('refreshToken', token, {
      ...cookieOptions,
      expires,
    });
  },
  setLoginError(state, message) {
    state.loginError = message;
  },
  setLoginErrorResponse(state, payload) {
    state.loginErrorResponse = payload;
  },
  setLogoutSource(state, source) {
    state.logoutSource = source;
  },
  setIsLoggingIn(state, value) {
    state.isLoggingIn = value;
  },
  setIsFinishedRefreshingAuth(state, value) {
    state.isFinishedRefreshingAuth = value;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
