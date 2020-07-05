import Automerge from 'automerge';
import Vue from 'vue';
import { api } from '../../helpers/api';
import { Diff } from '../../../common/diff';
import { applyNoteContentChanges, changesFromDiffs } from '../../../common/applyChanges';
import { getNoteContent } from '../../helpers/noteMixins';
import * as pako from 'pako';

const diff = new Diff();

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
  isSyncing: false,
};

export const getters = {
  noteById: (state) => (id) => id in state.byIds ? state.byIds[id] : {},
  selectedNoteId: (state) => state.selectedNoteId,
  selectedNote: (state, getters) => state.selectedNoteId ? getters.noteById(state.selectedNoteId) : {},
  toDeleteNote: (state, getters) => state.toDeleteNoteId ? getters.noteById(state.toDeleteNoteId) : {},
  allNotes: (state, getters) => state.allIds.map(id => getters.noteById(id)),
  isLoading: (state) => state.isLoading,
  isSyncing: (state) => state.isSyncing,
  pendingSyncTitleById: (state) => state.pendingSyncTitleById,
};

export const actions = {
  async fetchNotes({ commit }) {
    commit('setIsLoading', true);
    try {
      const resp = await api.get('/note');
      commit('setNotes', resp.data);
    } catch (err) {
      // TODO: Display error message on the interface
      console.error(err);
    } finally {
      commit('setIsLoading', false);
    }
  },
  async createNote({ commit }, { title, content, contentType }) {
    commit('setIsLoading', true);
    try {
      const resp = await api.post('/note/create', {
        title,
        content: Automerge.save(content),
        contentType,
      });
      commit('appendNote', resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsLoading', false);
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
      const resp = await api.delete(`/note/${_id}`);
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
  changeNoteContent({ getters, commit }, { _id, content, contentType }) {
    syncNoteContent({ getters, commit }, { _id, content, contentType });
  },
};

export const mutations = {
  setIsLoading(state, value) {
    state.isLoading = value;
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
      note.content = Automerge.load(note.content);
      allIds.push(note._id);
      byIds[note._id] = note;
    });
    state.allIds = allIds;
    state.byIds = byIds;
  },
  // appendNote will add the new note to the current state
  appendNote(state, newNote) {
    newNote.content = Automerge.load(newNote.content);
    state.allIds.push(newNote._id);
    state.byIds[newNote._id] = newNote;
  },
  // setSelectedNote replaces the current selectedNoteId with the new one
  // the parameter can be an object, but we want to indicate that we only
  // want the _id field
  setSelectedNote(state, { _id }) {
    state.selectedNoteId = _id;
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
  },
  // setNoteTitle does 2 things it changes the note's title in the state
  // and then push a pending sync to be synced later
  setNoteTitle(state, { _id, title }) {
    const { byIds, pendingSyncTitleById } = state;
    // Retrieve the current note from the state
    const note = byIds[_id];
    // Set its title to the new title
    note.title = title;
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
    state.pendingSyncTitleById = pendingSyncTitleById;
  },
  setNoteContent(state, { _id, content, contentType }) {
    const { byIds } = state;
    const note = byIds[_id];
    note.content = content;
    note.contentType = contentType;
  },
  removePendingSyncTitle(state, { _id }) {
    delete state.pendingSyncTitleById[_id];
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
  api.patch(`/note/${_id}`, {
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

const syncNoteContent = debounce(({ getters, commit }, { _id, content, contentType }) => {
  // The content here is a function which returns the string content
  // We want to do this because the get function in toastui is expensive
  // so calling that function on every key press is a waste when
  // what we really want is the latest content
  const note = getters.noteById(_id);
  content = content();
  const diffs = diff.main(getNoteContent(note), content, false);
  const changes = changesFromDiffs(diffs);
  if (changes.length > 0) {
    content = applyNoteContentChanges(note.content, changes);
    commit('setNoteContent', { _id, content, contentType });
    content = Automerge.save(content);
    content = pako.deflate(content, { to: 'string' });
    Vue.prototype.$socket.send(JSON.stringify({
      action: 'contentUpdated',
      payload: {
        id: _id,
        content,
      },
    }));
  }
}, 500, false);

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
