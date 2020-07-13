import Vue from 'vue';
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
    Vue.prototype.$socket.send(JSON.stringify({
      action: Actions.ENTER_NOTE,
      payload: {
        _id,
      },
    }));
  },
  [Actions.NOTE_ENTERED]({ commit }, data) {
    const { id, color, name, currCursors } = data.payload;
    commit('setCurrent', {
      id, color, name,
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
    Vue.prototype.$socket.send(JSON.stringify({
      action: Actions.USER_LEFT,
      payload: {
        _id,
        id: getters.current.id,
      },
    }));
  },
  changeCursor({ getters, commit }, { note, index, length }) {
    commit('setCurrent', {
      index,
      length,
    });
    if (getters.current.id) {
      Vue.prototype.$socket.send(JSON.stringify({
        action: Actions.CURSOR_UPDATED,
        payload: {
          _id: note._id,
          id: getters.current.id,
          index,
          length,
        },
      }));
    }
  },
  [Actions.USER_ENTERED]({ commit }, data) {
    const { id, color, name } = data.payload;
    commit('appendUserCursor', {
      id, color, name,
    });
  },
  [Actions.USER_LEFT]({ commit }, data) {
    const { id } = data.payload;
    commit('removeUserCursor', { id });
  },
  [Actions.CURSOR_UPDATED]({ getters, commit }, data) {
    let { id, index, name, length, color } = data.payload;
    const currUserCursor = getters.userCursorById(id);
    if (currUserCursor !== undefined) {
      if (color === undefined) {
        color = currUserCursor.color;
      }
      commit('updateUserCursor', {
        id, index, name, length, color,
      });
    }
  },
};

const mutations = {
  appendUserCursor(state, { id, index, name, length, color }) {
    if (!(id in state.userCursorsById)) {
      state.allUserCursorIds.push(id);
    }
    state.userCursorsById[id] = {
      id, index, name, length, color,
    };
  },
  removeUserCursor(state, { id }) {
    state.allUserCursorIds = state.allUserCursorIds.filter(
      (userCursorId) => userCursorId === id);
    delete state.userCursorsById[id];
  },
  updateUserCursor(state, { id, index, name, length, color }) {
    state.userCursorsById = {
      ...state.userCursorsById,
      [id]: {
        ...(state.userCursorsById[id] || {}),
        id, index, name, length, color,
      },
    };
  },
  setUserCursors(state, userCursors) {
    let allUserCursorIds = [], userCursorsById = {};
    userCursors.forEach((cursor) => {
      allUserCursorIds.push(cursor.id);
      userCursorsById[cursor.id] = cursor;
    });
    state.allUserCursorIds = allUserCursorIds;
    state.userCursorsById = userCursorsById;
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
