import Axios from 'axios';
import PageResponse from '../../helpers/pageResponse';

const state = {
  userPagination: new PageResponse(),
  usersIsLoading: false,
};

const getters = {
  allUsers: (state) => state.userPagination.getItems(),
  userPages: (state) => state.userPagination.getPages(),
  manageUserCurrentPage: (state) => state.userPagination.getCurrentPage(),
  usersIsLoading: (state) => state.usersIsLoading,
};

const actions = {
  async fetchUsers({ commit }, page) {
    commit('setUsersIsLoading', true);
    try {
      const resp = await Axios.get('/user/', {
        params: {
          page,
        },
      });
      commit('setUsers', { ...resp.data, currentPage: page });
    } catch (err) {
      console.error(err);
    } finally {
      commit('setUsersIsLoading', false);
    }
  },
};

const mutations = {
  setUsers(state, payload) {
    state.userPagination = new PageResponse(payload);
  },
  setUsersIsLoading(state, value) {
    state.usersIsLoading = value;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
