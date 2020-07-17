import Vue from 'vue';
import Cookie from 'js-cookie';
import WS from '../../helpers/ws';
import { Actions } from '../../../common/collab';

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

const actions = {
  async login({ commit }, { username, password }) {
    try {
      const resp = await Vue.prototype.$http.post(`/auth/login`, {
        username,
        password,
      });
      commit('setToken', resp.data.accessToken);
      commit('setRefreshToken', resp.data.refreshToken);
      commit('setUser', resp.data.user);
    } catch (err) {
      console.error(err);
    }
  },
  async logout({ commit }) {
    await Vue.prototype.$http.post('/auth/logout');
    commit('setUser', {});
    commit('setToken', '');
    commit('setRefreshToken', '');
    delete Vue.prototype.$http.defaults.headers.common['Authorization'];
    delete WS.defaults['Authorization'];
  },
  async checkLoggedIn({ commit, getters, dispatch }) {
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
          commit('setUser', resp.data.user);
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
    }
  },
  async [Actions.NOT_AUTHENTICATED]({ dispatch }) {
    await dispatch('checkLoggedIn');
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
    WS.defaults['Authorization'] = token;
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
