import { apiAction } from './api';
import {
  FETCH_NOTES, SET_NOTES, CREATE_NOTE, APPEND_NOTE, UPDATE_NOTE_TITLE,
  SET_SELECTED_NOTE, SET_TO_DELETE_NOTE, DELETE_NOTE, UPDATE_NOTE_CONTENT,
} from './types';
import { getNotesState } from '../selectors/notes';

export const fetchNotes = () => apiAction({
  url: '/note',
  method: 'GET',
  onSuccess: (data) => ({
    type: SET_NOTES,
    payload: data,
  }),
  // TODO: Display error message on the interface
  onFailure: (error) => { console.log(`Error: ${error}`); },
  type: FETCH_NOTES,
});

export const createNote = ({ title, content, contentType }) => apiAction({
  url: '/note/create',
  method: 'POST',
  data: {
    title,
    content,
    contentType,
  },
  onSuccess: (data) => ({
    type: APPEND_NOTE,
    payload: data,
  }),
  onFailure: (error) => { console.log(`Error: ${error}`); },
  type: CREATE_NOTE,
});

export const setSelectedNote = ({_id}) => ({
  type: SET_SELECTED_NOTE,
  payload: { _id },
});

export const setToDeleteNote = ({_id}) => ({
  type: SET_TO_DELETE_NOTE,
  payload: { _id },
});

export const deleteNote = ({_id}) => apiAction({
  url: `/note/${_id}`,
  method: 'DELETE',
  onSuccess: (data) => ({
    type: DELETE_NOTE,
    payload: data,
  }),
  onFailure: (error) => { console.log(`Error: ${error}`); },
});

const syncNoteTitle = debounce((dispatch, getState) => {
  const notes = getNotesState(getState());
  for (const _id in notes.pendingSyncTitleById) {
    const sync = notes.pendingSyncTitleById[_id];
    if (sync.status !== 'pending') {
      continue;
    }
    sync.status = 'in_progress';
    dispatch(apiAction({
      url: `/note/${sync._id}`,
      method: 'PATCH',
      label: UPDATE_NOTE_TITLE,
      data: {
        title: sync.title,
      },
      onSuccess: () => {
        if (notes.pendingSyncTitleById[_id].status === 'in_progress') {
          delete notes.pendingSyncTitleById[_id];
        }
      },
      onFailure: (error) => { console.error(error) },
    }));
  }
}, 1000, false);

export const changeNoteTitle = ({ _id, title }) => (dispatch, getState) => {
  syncNoteTitle(dispatch, getState);
  dispatch({
    type: UPDATE_NOTE_TITLE,
    payload: {
      _id, title,
    },
  });
};

const syncNoteContent = debounce((dispatch, { _id, content, contentType }) => {
  content = content();
  dispatch(apiAction({
    url: `/note/${_id}`,
    method: 'PATCH',
    label: UPDATE_NOTE_CONTENT,
    data: {
      content,
      contentType,
    },
    onSuccess: () => ({
      type: UPDATE_NOTE_CONTENT,
      payload: {
        _id, content, contentType,
      },
    }),
    onFailure: (error) => { console.error(error) },
  }));
}, 1000, false);

export const changeNoteContent = ({ _id, content, contentType }) => (dispatch) => {
  syncNoteContent(dispatch, { _id, content, contentType });
};

function debounce(func, wait, immediate) {
	let timeout;
	return function() {
		const context = this, args = arguments;
		const later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}
