import { combineReducers } from 'redux';
import notes from './notes';
import config from './config';

export default combineReducers({
  notes, config,
});
