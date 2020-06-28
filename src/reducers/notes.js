import {
  SET_NOTES, API_START, FETCH_NOTES, API_END, APPEND_NOTE,
  SET_SELECTED_NOTE, SET_TO_DELETE_NOTE, DELETE_NOTE,
  UPDATE_NOTE_TITLE,
  UPDATE_NOTE_CONTENT,
} from '../actions/types';

const initialState = {
  allIds: [],
  byIds: {},
  selectedNoteId: '',
  toDeleteNoteId: '',
  pendingSyncTitleById: {},
  pendingSyncContentById: {},
  isLoading: false,
  isSyncing: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case SET_NOTES: {
      const allIds = [];
      const byIds = {};
      for (const note of action.payload) {
        allIds.push(note._id);
        byIds[note._id] = note;
      }
      return {
        ...state,
        allIds,
        byIds,
      };
    }
    case APPEND_NOTE: {
      const { allIds, byIds } = state;
      allIds.push(action.payload._id);
      byIds[action.payload._id] = action.payload;
      return {
        ...state,
        allIds,
        byIds,
      };
    }
    case SET_SELECTED_NOTE: {
      const { _id } = action.payload;
      return {
        ...state,
        selectedNoteId: _id,
      };
    }
    case SET_TO_DELETE_NOTE: {
      const { _id } = action.payload;
      return {
        ...state,
        toDeleteNoteId: _id,
      };
    }
    case DELETE_NOTE: {
      const { _id, status } = action.payload;
      if (status !== 200) {
        return {
          ...state,
        };
      }
      let { allIds, byIds } = state;
      allIds = allIds.filter(id => id !== _id);
      delete byIds[_id];
      return {
        ...state,
        allIds,
        byIds,
      };
    }
    case UPDATE_NOTE_TITLE: {
      const { _id, title } = action.payload;
      const { byIds, pendingSyncTitleById } = state;
      let note = byIds[_id];
      note.title = title;
      let sync = {
        _id,
      };
      if (_id in pendingSyncTitleById) {
        sync = pendingSyncTitleById[_id];
      } else {
        pendingSyncTitleById[_id] = sync;
      }
      sync.title = title;
      sync.status = 'pending';
      return {
        ...state,
        pendingSyncTitleById,
      };
    }
    case UPDATE_NOTE_CONTENT: {
      const { _id, content, contentType } = action.payload;
      const { byIds, pendingSyncContentById } = state;
      let note = byIds[_id];
      note.content = content;
      note.contentType = contentType;
      let sync = {
        _id,
      };
      if (_id in pendingSyncContentById) {
        sync = pendingSyncContentById[_id];
      } else {
        pendingSyncContentById[_id] = sync;
      }
      sync.content = content;
      sync.contentType = contentType;
      sync.status = 'pending';
      return {
        ...state,
        pendingSyncContentById,
      };
    }
    case API_START: {
      const { type } = action.payload;
      switch (type) {
        case FETCH_NOTES: {
          return {
            ...state,
            isLoading: true,
          };
        }
        case UPDATE_NOTE_TITLE: {
          return {
            ...state,
            isSyncing: true,
          };
        }
        case UPDATE_NOTE_CONTENT: {
          return {
            ...state,
            isSyncing: true,
          };
        }
      default:
        return state;
      }
    }
    case API_END: {
      const { type } = action.payload;
      switch (type) {
        case FETCH_NOTES: {
          return {
            ...state,
            isLoading: false,
          };
        }
        case UPDATE_NOTE_TITLE: {
          return {
            ...state,
            isSyncing: false,
          };
        }
        case UPDATE_NOTE_CONTENT: {
          return {
            ...state,
            isSyncing: false,
          };
        }
      default:
        return state;
      }
    }
    default: {
      return state;
    }
  }
}
