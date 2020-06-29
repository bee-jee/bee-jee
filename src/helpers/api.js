import axios from 'axios';
import { apiUrl } from './url';

// The reason we have this api function is that we can set the default
// configuration for axios such as baseURL, HTTP headers
// this will return the axios so it will be used exactly
// the same as axios
export const api = (() => {
  axios.defaults.baseURL = apiUrl('/');
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.headers.common['Accept'] = 'application/json';
  // TODO: Once we have authentication we want to retrieve
  // the authentication token and put it in the `Authorization` HTTP
  // headers
  return axios;
})();

export const toContentType = (value) => {
  switch (value) {
    case 'wysiwyg':
      return 'html';
    default:
      return value;
  }
};

export const toEditType = (value) => {
  switch (value) {
    case 'html':
      return 'wysiwyg';
    default:
      return value;
  }
};
