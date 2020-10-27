import Axios from "axios";

export function createRefreshAuth(store) {
  Axios.interceptors.request.use((request) => {
    request.headers['Authorization'] = `Bearer ${store.getters.token}`;
    return request;
  });

  return async () => {
    try {
      if (store.getters.token === '') {
        throw new Error('Missing access token');
      }
      await store.dispatch('refreshToken');
    } finally {
      store.commit('setIsFinishedRefreshingAuth', true);
    }
  }
}
