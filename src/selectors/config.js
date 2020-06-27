export const getConfigState = (store) => store.config;

export const getConfig = (store, key) =>
  getConfigState(store) ? getConfigState(store)[key] : null;
