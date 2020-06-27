import { API } from '../actions/types';
import { apiStart, apiError, apiEnd } from '../actions/api';
import axios from 'axios';
import { apiUrl } from '../helpers/url';

const apiMiddleware = ({ dispatch }) => (next) => (action) => {
  next(action);

  if (action.type !== API) {
    return;
  }

  const {
    url, method, data, onSuccess, onFailure, label, headers,
  } = action.payload;
  axios.defaults.baseURL = apiUrl('/');
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.headers.common['Accept'] = 'application/json';

  if (label) {
    dispatch(apiStart(label));
  }

  // Axios requires params for GET or DELETE, and data otherwise
  const dataOrParams = ['GET', 'DELETE'].includes(method) ? 'params' : 'data';
  axios.request({
    url,
    method,
    headers,
    [dataOrParams]: data,
  })
    .then(({data}) => {
      dispatch(onSuccess(data));
    })
    .catch((error) => {
      dispatch(apiError(error));
      const result = onFailure(error);
      if (result) {
        dispatch(onFailure);
      }
    })
    .finally(() => {
      if (label) {
        dispatch(apiEnd(label));
      }
    });
}

export default apiMiddleware;
