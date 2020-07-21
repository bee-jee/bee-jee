import Vue from 'vue';
import { encodeDoc, decodeDoc, arrayToString, Actions } from '../../../common/collab';
import { wsSend } from '../../helpers/ws';

export const state = {
  // allIds contains only the notes' IDs, the reason
  // we want to do this is that we can have a quick way
  // to iterate through all notes and retrieve the note's
  // information via byIds
  allIds: [],
  // byIds contains the notes' information as an object
  // with the index is its _id
  byIds: {},
  // Because the database we are using is mongoDB which stores
  // ID as an 12-byte value and when encoded as JSON will be a
  // hexidecimal string therefore the IDs will have string type
  selectedNoteId: '',
  toDeleteNoteId: '',
  isLoading: false,
  isCreatingNote: false,
  isUpdatingNoteTitle: false,
  isSyncing: false,
};

export const getters = {
  noteById: (state) => (id) => id in state.byIds ? state.byIds[id] : {},
  selectedNoteId: (state) => state.selectedNoteId,
  selectedNote: (state, getters) => state.selectedNoteId ? getters.noteById(state.selectedNoteId) : {},
  toDeleteNote: (state, getters) => state.toDeleteNoteId ? getters.noteById(state.toDeleteNoteId) : {},
  allNotes: (state, getters) => state.allIds.map(id => getters.noteById(id)),
  isLoading: (state) => state.isLoading,
  isCreatingNote: (state) => state.isCreatingNote,
  isUpdatingNoteTitle: (state) => state.isUpdatingNoteTitle,
  isSyncing: (state) =>  state.isSyncing || state.isUpdatingNoteTitle,
};

export const actions = {
  async fetchNotes({ commit }) {
    commit('setIsLoading', true);
    try {
      const resp = await Vue.prototype.$http.get('/note');
      commit('setNotes', resp.data);
    } catch (err) {
      // TODO: Display error message on the interface
      console.error(err);
    } finally {
      commit('setIsLoading', false);
    }
  },
  async createNote({ commit }, { title, content, contentType }) {
    commit('setIsCreatingNote', true);
    try {
      const resp = await Vue.prototype.$http.post('/note/create', {
        title,
        content: encodeDoc(content),
        contentType,
      });
      commit('appendNote', resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsCreatingNote', false);
    }
  },
  setSelectedNote({ commit }, { _id }) {
    commit('setSelectedNote', { _id });
  },
  setToDeleteNote({ commit }, { _id }) {
    commit('setToDeleteNote', { _id });
  },
  async deleteNote({ commit }, { _id }) {
    try {
      const resp = await Vue.prototype.$http.delete(`/note/${_id}`);
      commit('deleteNote', resp.data);
    } catch (err) {
      console.error(err);
    }
  },
  async editNoteTitle({ commit }, { _id, title }) {
    try {
      commit('setIsUpdatingNoteTitle', true);
      const resp = await Vue.prototype.$http.patch(`/note/${_id}`, {
        title,
      });
      commit('setNoteTitle', { _id, title: resp.data.title });
    } finally {
      commit('setIsUpdatingNoteTitle', false);
    }
  },
  changeNoteContent({ getters, commit }, { _id, ops }) {
    const note = getters.noteById(_id);
    note.content.getText('text').applyDelta(ops);
    commit('setNoteContent', note);
  },
};

export const mutations = {
  setIsLoading(state, value) {
    state.isLoading = value;
  },
  setIsCreatingNote(state, value) {
    state.isCreatingNote = value;
  },
  setIsSyncing(state, value) {
    state.isSyncing = value;
  },
  // setNotes will replace the current notes in the state to
  // the new ones
  setNotes(state, notes) {
    const allIds = [];
    const byIds = {};
    notes.forEach((note) => {
      note.content = decodeDoc(note.content);
      allIds.push(note._id);
      // The reason we want to Object.freeze the notes is because
      // the note.content is a doc yjs object, and this object can
      // have very high depth, which will cause maximum call stack
      // if Vue makes it reactive. The downside of this is that we
      // have to handle reactivity by ourselves.
      byIds[note._id] = Object.freeze(note);
    });
    // Before changing the state, we need to unsubscribe to content update
    // on the selected note if available
    if (state.selectedNoteId && state.byIds[state.selectedNoteId]) {
      unsubscribeContentUpdate(state.byIds[state.selectedNoteId]);
    }
    state.allIds = allIds;
    state.byIds = byIds;
    if (state.selectedNoteId && state.byIds[state.selectedNoteId]) {
      subscribeContentUpdate(state.byIds[state.selectedNoteId]);
    }
  },
  // appendNote will add the new note to the current state
  appendNote(state, newNote) {
    newNote.content = decodeDoc(newNote.content);
    state.allIds.push(newNote._id);
    // The reason we want to Object.freeze the notes is because
    // the note.content is a doc yjs object, and this object can
    // have very high depth, which will cause maximum call stack
    // if Vue makes it reactive. The downside of this is that we
    // have to handle reactivity by ourselves.
    state.byIds[newNote._id] = Object.freeze(newNote);
  },
  // setSelectedNote replaces the current selectedNoteId with the new one
  // the parameter can be an object, but we want to indicate that we only
  // want the _id field
  setSelectedNote(state, { _id }) {
    // Make sure we don't subscribe to the previous selected note
    if (state.selectedNoteId && state.byIds[state.selectedNoteId]) {
      unsubscribeContentUpdate(state.byIds[state.selectedNoteId]);
    }
    state.selectedNoteId = _id;
    if (state.byIds[_id]) {
      subscribeContentUpdate(state.byIds[_id]);
    }
  },
  // The reason we want to store toDeleteNote in the state is that we can
  // have a single modal to confirm if the user wanted to delete the note.
  // Therefore, the modal has to be in the note-explorer, and note-explorer-item
  // will trigger the setToDeleteNote action, so multiple components require
  // to access the same state
  setToDeleteNote(state, { _id }) {
    state.toDeleteNoteId = _id;
  },
  deleteNote(state, { _id, status }) {
    if (status !== 200) {
      return;
    }
    state.allIds = state.allIds.filter(id => id !== _id);
    delete state.byIds[_id];
    state.byIds = {
      ...state.byIds,
    };
  },
  // setNoteTitle does 2 things it changes the note's title in the state
  // and then push a pending sync to be synced later
  setNoteTitle(state, { _id, title }) {
    const { byIds } = state;
    // Retrieve the current note from the state
    const note = byIds[_id];
    // Set its title to the new title
    // Since the note object is Object.freezed therefore we have to create
    // a new object and freeze it.
    byIds[_id] = Object.freeze({
      ...note,
      title,
    });
  },
  setNoteContent(state, { _id }) {
    const { byIds } = state;
    const note = byIds[_id];
    // The reason we want to Object.freeze the notes is because
    // the note.content is a doc yjs object, and this object can
    // have very high depth, which will cause maximum call stack
    // if Vue makes it reactive. The downside of this is that we
    // have to handle reactivity by ourselves.
    Vue.set(state.byIds, _id, Object.freeze({
      ...note,
    }));
  },
  setIsUpdatingNoteTitle(state, value) {
    state.isUpdatingNoteTitle = value;
  },
};

const subscribeContentUpdate = (note) => {
  note.content.on('update', (update, origin) => {
    if (origin !== null && origin === 'ws') {
      return;
    }
    wsSend({
      action: Actions.CONTENT_UPDATED,
      payload: {
        id: note._id,
        mergeChanges: arrayToString(update),
      },
    });
  });
};

const unsubscribeContentUpdate = (note) => {
  note.content.off('update');
}

export default {
  state,
  getters,
  actions,
  mutations,
};
