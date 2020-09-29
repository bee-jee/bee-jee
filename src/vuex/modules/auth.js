import Vue from 'vue';
import Cookie from 'js-cookie';
import WS from '../../helpers/ws';
import { Actions } from '../../../common/collab';

const env = {
  VUE_APP_IS_HTTPS: process.env.VUE_APP_IS_HTTPS === '1' || process.env.VUE_APP_IS_HTTPS === 'true',
};

const state = {
  user: {},
  token: Cookie.get('token') || '',
  refreshToken: Cookie.get('refreshToken') || '',
  loginError: '',
  logoutSource: '',
  isLoggingIn: false,
  isCheckingLoggedin: false,
};

const getters = {
  user: state => state.user,
  isLoggedIn: state => !!state.user._id,
  token: state => state.token,
  refreshToken: state => state.refreshToken,
  loginError: state => state.loginError,
  logoutSource: state => state.logoutSource,
  isLoggingIn: state => state.isLoggingIn,
  isCheckingLoggedin: state => state.isCheckingLoggedin,
};

const actions = {
  async login({ commit }, { username, password }) {
    commit('setIsLoggingIn', true);
    try {
      const resp = await Vue.prototype.$http.post(`/auth/login`, {
        username,
        password,
      });
      commit('setToken', resp.data.accessToken);
      commit('setRefreshToken', resp.data.refreshToken);
      commit('setUser', resp.data.user);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        commit('setLoginError', err.response.data.message);
      } else {
        commit('setLoginError', err.message);
      }
    } finally {
      commit('setIsLoggingIn', false);
    }
  },
  async logout({ commit }, source) {
    if (source === undefined) {
      source = '';
    }
    commit('setLogoutSource', source);
    try {
      await Vue.prototype.$http.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    commit('setUser', {});
    commit('setToken', '');
    commit('setRefreshToken', '');
    delete Vue.prototype.$http.defaults.headers.common['Authorization'];
    delete WS.defaults['Authorization'];
  },
  async checkLoggedIn({ commit, getters, dispatch }) {
    if (getters.isCheckingLoggedin) {
      return;
    }
    commit('setIsCheckingLoggedin', true);
    const finaliseUser = async (user) => {
      commit('setUser', user);
      if (!user._id) {
        await dispatch('logout');
      }
    };
    const tryRefreshToken = async () => {
      if (getters.refreshToken) {
        try {
          const resp = await Vue.prototype.$http.post('/auth/refreshToken', {
            refreshToken: getters.refreshToken,
          });
          commit('setToken', resp.data.accessToken);
          commit('setRefreshToken', resp.data.refreshToken);
          finaliseUser(resp.data.user);
        } catch(err) {
          await dispatch('logout');
        }
        return;
      }
      await dispatch('logout');
    };
    try {
      const resp = await Vue.prototype.$http.get(`/auth/user`);
      await finaliseUser(resp.data);
    } catch (err) {
      await tryRefreshToken();
    } finally {
      commit('setIsCheckingLoggedin', false);
    }
  },
  async [Actions.NOT_AUTHENTICATED]({ dispatch }) {
    await dispatch('checkLoggedIn');
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
    Cookie.set('token', token, cookieOptions);
    Vue.prototype.$http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    WS.defaults['Authorization'] = token;
  },
  setRefreshToken(state, token) {
    state.refreshToken = token;
    Cookie.set('refreshToken', token, cookieOptions);
  },
  setLoginError(state, message) {
    state.loginError = message;
  },
  setLogoutSource(state, source) {
    state.logoutSource = source;
  },
  setIsLoggingIn(state, value) {
    state.isLoggingIn = value;
  },
  setIsCheckingLoggedin(state, value) {
    state.isCheckingLoggedin = value;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
