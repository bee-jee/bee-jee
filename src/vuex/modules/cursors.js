import { Actions } from '../../../common/collab';

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
  leaveNote({ getters }) {
    if (!getters.current.id) {
      return;
    }
  },
  changeCursor() {

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
