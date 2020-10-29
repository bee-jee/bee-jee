import { Actions } from '../../../common/collab';
import { wsSend } from '../../helpers/ws';

const state = {
  allUserCursorIds: [],
  userCursorsById: {},
  current: {},
  colorIndex: 0,
};

const getters = {
  userCursorById: (state) => (id) => state.userCursorsById[id],
  allUserCursors: (state) => state.allUserCursorIds.map(id => state.userCursorsById[id]),
  current: (state) => state.current,
};

const actions = {
  enterNote(context, { _id }) {
    if (!_id ) {
      return;
    }
    wsSend({
      action: Actions.ENTER_NOTE,
      payload: {
        _id,
      },
    });
  },
  [Actions.NOTE_ENTERED]({ commit }, data) {
    const { id, color, name, initials, currCursors } = data.payload;
    commit('setCurrent', {
      id, color, name, initials,
    });
    Object.values(currCursors).forEach((cursor) => {
      if (cursor.id === id) {
        return;
      }
      commit('appendUserCursor', cursor);
    });
  },
  leaveNote({ getters }, { _id }) {
    if (!getters.current.id) {
      return;
    }
    wsSend({
      action: Actions.USER_LEFT,
      payload: {
        _id,
        id: getters.current.id,
      },
    });
  },
  changeCursor({ getters, commit }, { note, index, length }) {
    const { index: currIndex, length: currLength } = getters.current;
    commit('setCurrent', {
      index,
      length,
    });
    if (getters.current.id && (index !== currIndex || length !== currLength) && getters.isLoggedIn) {
      wsSend({
        action: Actions.CURSOR_UPDATED,
        payload: {
          _id: note._id,
          id: getters.current.id,
          index,
          length,
        },
      });
    }
  },
  [Actions.USER_ENTERED]({ commit }, data) {
    const { id, color, name, initials } = data.payload;
    commit('appendUserCursor', {
      id, color, name, initials,
    });
  },
  [Actions.USER_LEFT]({ commit }, data) {
    const { id } = data.payload;
    commit('removeUserCursor', { id });
  },
  [Actions.CURSOR_UPDATED]({ getters, commit }, data) {
    let { id, index, name, length, color, initials } = data.payload;
    const currUserCursor = getters.userCursorById(id);
    if (currUserCursor !== undefined) {
      if (color === undefined) {
        color = currUserCursor.color;
      }
      commit('updateUserCursor', {
        id, index, name, length, color, initials,
      });
    }
  },
};

const mutations = {
  appendUserCursor(state, { id, index, name, length, color, initials }) {
    if (!(id in state.userCursorsById)) {
      state.allUserCursorIds.push(id);
    }
    state.userCursorsById[id] = {
      id, index, name, length, color, initials,
    };
  },
  removeUserCursor(state, { id }) {
    state.allUserCursorIds = state.allUserCursorIds.filter(
      (userCursorId) => userCursorId === id);
    delete state.userCursorsById[id];
  },
  updateUserCursor(state, { id, index, name, length, color, initials }) {
    state.userCursorsById = {
      ...state.userCursorsById,
      [id]: {
        ...(state.userCursorsById[id] || {}),
        id, index, name, length, color, initials,
      },
    };
  },
  setCurrent(state, payload) {
    state.current = {
      ...state.current,
      ...payload,
    };
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
