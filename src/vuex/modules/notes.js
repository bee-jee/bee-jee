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
  isLoadingSharedNotes: false,
  sharedByIds: {},
  selectedNote: {},
  // Because the database we are using is mongoDB which stores
  // ID as an 12-byte value and when encoded as JSON will be a
  // hexidecimal string therefore the IDs will have string type
  toDeleteNoteId: '',
  isLoading: false,
  isCreatingNote: false,
  isLoadingSelectedNote: false,
  isUpdatingNote: false,
  isSyncing: false,
  numOfAllUnviewedNotes: ''
};

export const getters = {
  noteById: (state) => (id) => id in state.byIds ? state.byIds[id] : {},
  selectedNote: (state) => state.selectedNote,
  toDeleteNote: (state, getters) => state.toDeleteNoteId ? getters.noteById(state.toDeleteNoteId) : {},
  allMyNotes: (state, getters) => state.allIds
    .filter(id => !(id in state.sharedByIds))
    .map(id => getters.noteById(id)),
  isLoading: (state) => state.isLoading,
  isCreatingNote: (state) => state.isCreatingNote,
  isLoadingSelectedNote: (state) => state.isLoadingSelectedNote,
  isUpdatingNote: (state) => state.isUpdatingNote,
  isSyncing: (state) => state.isSyncing || state.isUpdatingNote,
  isLoadingSharedNotes: (state) => state.isLoadingSharedNotes,
  sharedById: (state) => (id) => state.sharedByIds[id] || {},
  numOfAllUnviewedNotes:(state)=> state.numOfAllUnviewedNotes,
  allSharedNotes: (state, getters) => state.allIds
    .filter((id) => id in state.sharedByIds)
    .map(id => getters.noteById(id)),
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
  async fetchSharedNotes({ commit }) {
    commit('setIsLoadingSelectedNote', true);
    try {
      const resp = await Vue.prototype.$http.get('/note/shared');
      commit('setSharedNotes', resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsLoadingSelectedNote', false);
    }
  },
  async fetchNumOfUnviewedSharedNutes({ commit }){
    try {
      const resp = await Vue.prototype.$http.get('/note/numOfUnviewed');
      // console.log(resp.data.num);
      commit('setNumOfAllUnviewedNotes', resp.data.num);
    }catch (err) {
      console.error(err);
    }
  },
  async createNote({ commit }, { title, content, permission }) {
    commit('setIsCreatingNote', true);
    try {
      const resp = await Vue.prototype.$http.post('/note/create', {
        title,
        content: encodeDoc(content),
        ...permission,
      });
      commit('appendNote', resp.data);
    } finally {
      commit('setIsCreatingNote', false);
    }
  },
  async setSelectedNote({ commit }, { _id }) {
    commit('setIsLoadingSelectedNote', true);
    try {
      const resp = await Vue.prototype.$http.get(`/note/${_id}`);
      const note = resp.data;
      note.content = decodeDoc(note.content);
      commit('setSelectedNote', note);
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsLoadingSelectedNote', false);
    }
  },
  async setSelectedSharedNote({ commit }, { _id }) {
    commit('setIsLoadingSelectedNote', true);
    try {
      const resp = await Vue.prototype.$http.get(`/note/shared/${_id}`);
      const { data: sharedNote } = resp;
      const { note } = sharedNote;
      note.content = decodeDoc(note.content);
      commit('updateSharedNote', sharedNote);
      commit('setSelectedNote', note);
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsLoadingSelectedNote', false);
    }
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
  async editNoteShare({ commit }, { _id, permission }) {
    commit('setIsUpdatingNote', true);
    try {
      const resp = await Vue.prototype.$http.patch(`/note/${_id}`, {
        ...permission,
      });
      commit('setNotePermission', {
        _id,
        visibility: resp.data.visibile,
        sharedUsers: resp.data.sharedUsers,
      });
    } finally {
      commit('setIsUpdatingNote', false);
    }
  },
  async editNoteTitle({ commit }, { _id, title }) {
    commit('setIsUpdatingNote', true);
    try {
      const resp = await Vue.prototype.$http.patch(`/note/${_id}`, {
        title,
      });
      commit('setNoteTitle', { _id, title: resp.data.title });
    } finally {
      commit('setIsUpdatingNote', false);
    }
  },
  changeNoteContent({ commit }, { note, ops }) {
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
  resetAllNotes(state) {
    state.allIds = [];
    state.byIds = {};
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
    state.allIds = state.allIds.concat(allIds);
    state.byIds = {
      ...state.byIds,
      ...byIds,
    };
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
  // setSelectedNote replaces the current selectedNote with the new one
  setSelectedNote(state, note) {
    // Make sure we don't subscribe to the previous selected note
    if (state.selectedNote._id) {
      unsubscribeContentUpdate(state.selectedNote);
    }
    state.selectedNote = Object.freeze(note);
    if (note._id) {
      subscribeContentUpdate(note);
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
    state.byIds = {
      ...state.byIds,
      [_id]: Object.freeze({
        ...note,
        title,
      }),
    };
    state.selectedNote = Object.freeze({
      ...state.selectedNote,
      title,
    });
  },
  setNoteContent(state, { _id, content }) {
    const { byIds } = state;
    const note = byIds[_id];
    Vue.set(state.byIds, _id, Object.freeze({
      ...note,
      content,
    }));
  },
  setNotePermission(state, { _id, visibility, sharedUsers }) {
    const { byIds } = state;
    const note = byIds[_id];
    Vue.set(state.byIds, _id, Object.freeze({
      ...note,
      visibility,
      sharedUsers,
    }));
  },
  setIsUpdatingNote(state, value) {
    state.isUpdatingNote = value;
  },
  setIsLoadingSelectedNote(state, value) {
    state.isLoadingSelectedNote = value;
  },
  setIsLoadingSharedNotes(state, value) {
    state.isLoadingSharedNotes = value;
  },
  setNumOfAllUnviewedNotes(state, value){
    state.numOfAllUnviewedNotes = value;
  },
  setSharedNotes(state, sharedNotes) {
    const allSharedIds = [];
    const sharedByIds = {};
    const byIds = {};
    sharedNotes.forEach((sharedNote) => {
      const note = sharedNote.note;
      note.content = decodeDoc(note.content);
      allSharedIds.push(note._id);
      byIds[note._id] = Object.freeze(note);
      sharedByIds[note._id] = Object.freeze(sharedNote);
    });
    state.allIds = state.allIds.concat(allSharedIds);
    state.byIds = {
      ...state.byIds,
      ...byIds,
    };
    state.sharedByIds = sharedByIds;
  },
  updateSharedNote(state, sharedNote) {
    const { note } = sharedNote;
    state.sharedByIds[note._id] = Object.freeze(sharedNote);
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
