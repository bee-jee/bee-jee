import rootReducer from './reducers';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import apiMiddleware from './middleware/api';

const store = createStore(rootReducer, applyMiddleware(
  thunk,
  apiMiddleware,
));
window.store = store;
export default store;
