const state = {
  allNotifications: [],
  newSharedNotesNotification: [],
};

const getters = {
  allNotifications: (state) => state.allNotifications,
  newSharedNotesNotification: (state) => state.newSharedNotesNotification,
};

const actions = {
  notification({ commit }, { type, params }) {
    switch (type) {
      case 'newSharedNote':
        commit('addNewSharedNoteNotification', params);
        break;
    }
  },
};

const mutations = {
  addNewSharedNoteNotification(state, params) {
    state.newSharedNotesNotification.push({
      ...params,
    });
    state.numOfAllUnviewedNotes = params.numOfAllUnviewedNotes;
  },
  addNotification(state, notification) {
    state.allNotifications.push(notification);
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
