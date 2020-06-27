import { API_START, API_END, API_ERROR, API } from './types';

export const apiStart = (type) => ({
  type: API_START,
  payload: {
    type,
  },
});

export const apiEnd = (type) => ({
  type: API_END,
  payload: {
    type,
  },
});

export const apiError = (error) => ({
  type: API_ERROR,
  error,
});

export function apiAction({
  url = '',
  method = 'GET',
  data = null,
  onSuccess = () => { },
  onFailure = () => { },
  label = '',
  headers = null,
}) {
  return {
    type: API,
    payload: {
      url, method, data,
      onSuccess, onFailure,
      label, headers,
    },
  };
}
