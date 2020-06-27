import { SET_CONFIG } from './types';
import { getConfigState } from '../selectors/config';
import lzstring from 'lz-string';

const CONFIG_KEY = 'config';

export const retrieveConfig = () => {
  let config = {};
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    config = JSON.parse(lzstring.decompress(saved));
  }
  return {
    type: SET_CONFIG,
    payload: config,
  };
};

export const setConfig = (key, value) => (dispatch, getState) => {
  const config = getConfigState(getState());
  if (key in config) {
    config[key] = value;
  }
  localStorage.setItem(CONFIG_KEY, lzstring.compress(JSON.stringify(config)));
  dispatch({
    type: SET_CONFIG,
    payload: config,
  });
};
