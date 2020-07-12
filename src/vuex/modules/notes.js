import Vue from 'vue';
import { encodeDoc, decodeDoc, arrayToString } from '../../../common/collab';

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
  pendingSyncTitleById: {},
  isLoading: false,
  isCreatingNote: false,
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
  isSyncing: (state) =>  state.isSyncing || Object.keys(state.pendingSyncTitleById).length !== 0,
  pendingSyncTitleById: (state) => state.pendingSyncTitleById,
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
  changeNoteTitle({ getters, commit }, { _id, title }) {
    // We don't want to send an api request on every key stroke
    // therefore, what we want to do is update the state so that
    // the note's title is changed and then use debounce to delay
    // the api request
    commit('setNoteTitle', { _id, title });
    syncNoteTitle({ getters, commit }, { _id });
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
    const { byIds, pendingSyncTitleById } = state;
    // Retrieve the current note from the state
    const note = byIds[_id];
    // Set its title to the new title
    // Since the note object is Object.freezed therefore we have to create
    // a new object and freeze it.
    byIds[_id] = Object.freeze({
      ...note,
      title,
    });
    // Create a sync object to request to api
    let sync = {
      _id,
    };
    // If there's already a sync request on the queue
    if (_id in pendingSyncTitleById) {
      // then retrieve the sync object from the queue
      sync = pendingSyncTitleById[_id];
    } else {
      // Otherwise, put the newly created object on the queue
      pendingSyncTitleById[_id] = sync;
    }
    // Change the title of the sync object regardless of whether it
    // is a new sync object or existing one, we only want to sync the latest
    // title.
    // TODO: Implement a CRDT on the client so that it supports real-time editing
    // and then sync the CRDT with API by sending the edits to API, this edits
    // should be persisted offline (via IndexDB) because it is possible that
    // sending edits would take a long time (pasting of large data) and we
    // don't want to lose data
    sync.title = title;
    sync.status = 'pending';
    state.pendingSyncTitleById = {
      ...pendingSyncTitleById,
    };
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
  removePendingSyncTitle(state, { _id }) {
    delete state.pendingSyncTitleById[_id];
    state.pendingSyncTitleById = {
      ...state.pendingSyncTitleById,
    };
  },
};

const syncNoteTitle = debounce(({ getters, commit }, { _id }) => {
  if (!(_id in getters.pendingSyncTitleById)) {
    return;
  }
  const sync = getters.pendingSyncTitleById[_id];
  if (sync.status !== 'pending') {
    return;
  }
  sync.status = 'in_progress';
  Vue.prototype.$http.patch(`/note/${_id}`, {
    title: sync.title,
  })
    .then(() => {
      // TODO: Handle cases when the request has failed
      commit('removePendingSyncTitle', { _id });
    })
    .catch((err) => {
      console.error(err);
    });
}, 1000, false);

const subscribeContentUpdate = (note) => {
  note.content.on('update', (update, origin) => {
    if (origin !== null && origin === 'ws') {
      return;
    }
    Vue.prototype.$socket.send(JSON.stringify({
      action: 'contentUpdated',
      payload: {
        id: note._id,
        mergeChanges: arrayToString(update),
      },
    }));
  });
};

const unsubscribeContentUpdate = (note) => {
  note.content.off('update');
}

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

export default {
  state,
  getters,
  actions,
  mutations,
};
