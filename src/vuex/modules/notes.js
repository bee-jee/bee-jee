import Axios from 'axios';
import Vue from 'vue';
import { Awareness } from 'y-protocols/awareness';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { fuzzysearch } from '../../helpers/search';
import { currUserPref } from '../../helpers/currUserPref';
import { withBeeJeeWs } from '../../helpers/ws';

const RECENTLY_LIMIT = 15;

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
  numOfAllUnviewedNotes: '',
  showCreateNoteModal: false,
  newNoteParent: {},
  wsProvider: null,
  awareness: null,
  userCursorByIds: {},
  userCursorIds: [],
  noteTabIds: [],
  myNoteSearchKeyword: '',
  showNavigateNoteWidget: false,
  searchNavigateKeyword: '',
  selectedNavigateNoteWidgetIndex: 0,
};

export const getters = {
  noteById: (state) => (id) => (id in state.byIds ? state.byIds[id] : {}),
  selectedNote: (state) => state.selectedNote,
  toDeleteNote: (state, getters) => (state.toDeleteNoteId ? getters.noteById(state.toDeleteNoteId) : {}),
  allMyNotes: (state, getters) =>
    state.allIds.filter((id) => !(id in state.sharedByIds)).map((id) => getters.noteById(id)),
  isLoading: (state) => state.isLoading,
  isCreatingNote: (state) => state.isCreatingNote,
  isLoadingSelectedNote: (state) => state.isLoadingSelectedNote,
  isUpdatingNote: (state) => state.isUpdatingNote,
  isSyncing: (state) => state.isSyncing || state.isUpdatingNote,
  isLoadingSharedNotes: (state) => state.isLoadingSharedNotes,
  sharedById: (state) => (id) => state.sharedByIds[id] || {},
  numOfAllUnviewedNotes: (state) => state.numOfAllUnviewedNotes,
  allSharedNotes: (state, getters) =>
    state.allIds.filter((id) => id in state.sharedByIds).map((id) => getters.noteById(id)),
  showCreateNoteModal: (state) => state.showCreateNoteModal,
  newNoteParent: (state) => state.newNoteParent,
  allMyNotesTree: (state, getters) => buildNoteTree(getters.allMyNotes, state.myNoteSearchKeyword),
  allSharedNotesTree: (state, getters) => buildNoteTree(getters.allSharedNotes),
  wsProvider: (state) => state.wsProvider,
  websocketIsConnected: (state) => (state.wsProvider ? state.wsProvider.wsconnected : false),
  allUserCursors: (state) =>
    state.userCursorIds
      .filter((id) => (state.awareness.getLocalState().user ? id !== state.awareness.getLocalState().user.id : false))
      .map((id) => state.userCursorByIds[id]),
  noteTabs: (state, getters) =>
    state.noteTabIds.filter((id) => getters.noteById(id)._id).map((id) => getters.noteById(id)),
  allNotesForNavigate: (state) => {
    const keyword = state.searchNavigateKeyword.toLowerCase();
    const allNotes = Object.values(state.byIds || {})
      .concat(Object.values(state.sharedById || {}))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    const filteredNotes = [];
    let count = 0;

    allNotes.some((note) => {
      const [isMatched, indexes] = fuzzysearch(keyword, note.title.toLowerCase());
      if (isMatched) {
        filteredNotes.push({
          ...note,
          navigateIndexes: indexes,
        });
        count++;
      }
      return count >= RECENTLY_LIMIT;
    });

    return filteredNotes;
  },
  selectedNavigateNoteWidgetIndex: (state) => state.selectedNavigateNoteWidgetIndex,
};

export const actions = {
  async fetchNotes({ commit }) {
    commit('setIsLoading', true);
    try {
      const resp = await Axios.get('/note');
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
      const resp = await Axios.get('/note/shared');
      commit('setSharedNotes', resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsLoadingSelectedNote', false);
    }
  },
  async fetchNumOfUnviewedSharedNutes({ commit }) {
    try {
      const resp = await Axios.get('/note/numOfUnviewed');
      // console.log(resp.data.num);
      commit('setNumOfAllUnviewedNotes', resp.data.num);
    } catch (err) {
      console.error(err);
    }
  },
  async createNote({ commit }, { title, permission, parentNoteId }) {
    commit('setIsCreatingNote', true);
    try {
      const resp = await Axios.post('/note/create', {
        title,
        ...permission,
        parentNoteId,
      });
      commit('appendNote', resp.data);
    } finally {
      commit('setIsCreatingNote', false);
    }
  },
  async setSelectedNote({ commit, getters }, { _id }) {
    commit('setIsLoadingSelectedNote', true);
    try {
      const resp = await Axios.get(`/note/${_id}`);
      const note = resp.data;
      if (note._id) {
        currUserPref.setSelectedNoteType('note-edit');
        currUserPref.setSelectedNoteId(note._id);
      }
      commit('setSelectedNote', { note, token: getters.token });
      commit('appendNoteToTab', { _id: note._id });
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsLoadingSelectedNote', false);
    }
  },
  closeSelectedNote({ commit }) {
    commit('setSelectedNote', { note: {} });
  },
  async fetchPublicAccessNote({ commit, getters }, { _id }) {
    commit('setIsLoadingSelectedNote', true);
    try {
      const resp = await Axios.get(`/note/public/${_id}`);
      const note = resp.data;
      commit('setSelectedNote', { note, token: getters.token });
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsLoadingSelectedNote', false);
    }
  },
  async setSelectedSharedNote({ commit, getters }, { _id }) {
    commit('setIsLoadingSelectedNote', true);
    try {
      const resp = await Axios.get(`/note/shared/${_id}`);
      const { data: sharedNote } = resp;
      const { note } = sharedNote;
      if (note._id) {
        currUserPref.setSelectedNoteType('view-shared-note');
        currUserPref.setSelectedNoteId(note._id);
      }
      commit('updateSharedNote', sharedNote);
      commit('setSelectedNote', { note, token: getters.token });
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
      const resp = await Axios.delete(`/note/${_id}`);
      commit('deleteNote', resp.data);
    } catch (err) {
      console.error(err);
    }
  },
  async editNoteShare({ commit }, { _id, permission }) {
    commit('setIsUpdatingNote', true);
    try {
      const resp = await Axios.patch(`/note/${_id}`, {
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
      const resp = await Axios.patch(`/note/${_id}`, {
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
  async clearSelectedNoteContent({ commit, getters }) {
    commit('setIsUpdatingNote', true);
    const { selectedNote } = getters;
    try {
      await Axios.delete(`/note/${selectedNote._id}/clearContent`);
    } catch (err) {
      console.error(err);
    } finally {
      commit('setIsUpdatingNote', false);
    }
  },
};

function getNotePath(note) {
  return note.path || '/';
}

function buildNoteTree(allNotes, keyword = '') {
  const roots = [];
  const map = {};
  const sortedNotes = allNotes
    .sort((a, b) => getNotePath(a).split('/').length - getNotePath(b).split('/'))
    .map((note) => {
      const [isShown, indexes] = fuzzysearch(keyword.toLowerCase(), note.title.toLowerCase());
      return {
        ...note,
        children: [],
        parentNote: null,
        isShown,
        indexes,
      };
    });
  sortedNotes.forEach((note) => {
    map[note._id] = note;
  });
  sortedNotes.forEach((note) => {
    if (note.parent && note.parent in map) {
      note.parentNode = map[note.parent];
      map[note.parent].children.push(note);
    } else {
      roots.push(note);
    }
  });
  sortedNotes.forEach((note) => {
    if (note.isShown) {
      let parent = note.parentNode;
      while (parent) {
        parent.isShown = true;
        parent = parent.parentNode;
      }
    }
  });
  return roots;
}

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
      allIds.push(note._id);
      byIds[note._id] = note;
    });
    state.allIds = state.allIds.concat(allIds);
    state.byIds = {
      ...state.byIds,
      ...byIds,
    };
  },
  // appendNote will add the new note to the current state
  appendNote(state, newNote) {
    state.allIds.push(newNote._id);
    state.byIds[newNote._id] = newNote;
  },
  // setSelectedNote replaces the current selectedNote with the new one
  setSelectedNote(state, { note, token }) {
    const isValidNote = note && note._id;
    if (isValidNote) {
      note.content = new Y.Doc();
    }

    const awarenessListener = ({ added, updated }) => {
      const states = state.awareness.getStates();
      added.concat(updated).some((clientID) => {
        const aw = states.get(clientID);
        if (!aw || !aw.isServer) {
          return false;
        }

        state.userCursorByIds = aw.users;
        state.userCursorIds = Object.keys(aw.users);

        return true;
      });
    };
    if (state.wsProvider) {
      state.wsProvider.destroy();
      state.awareness.destroy();
    }
    state.selectedNote = {
      ...note,
      contentVersion: 0,
    };
    state.byIds[note._id] = {
      ...note,
      lastAccessed: new Date().getTime(),
    };
    if (isValidNote) {
      const awareness = new Awareness(note.content);
      state.wsProvider = new WebsocketProvider(process.env.VUE_APP_WS_URL, note._id, note.content, {
        params: {
          access_token: token,
        },
        awareness,
      });
      state.wsProvider.on('status', ({ status }) => {
        if (status === 'connected') {
          const { ws } = state.wsProvider;
          ws.onmessage = withBeeJeeWs(state.wsProvider, awareness);
        }
      });
      state.wsProvider.on('startSyncing', () => {
        state.isSyncing = true;
      });
      state.wsProvider.on('endSyncing', () => {
        state.isSyncing = false;
      });
      state.awareness = awareness;
      state.awareness.on('change', awarenessListener);
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
    state.allIds = state.allIds.filter((id) => id !== _id);
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
    state.byIds = {
      ...state.byIds,
      [_id]: {
        ...note,
        title,
      },
    };
    state.selectedNote = {
      ...state.selectedNote,
      title,
    };
    if (_id === state.selectedNote._id) {
      state.selectedNote = {
        ...state.selectedNote,
        title,
      };
    }
  },
  setNoteContent(state, { _id, content }) {
    const { byIds } = state;
    const note = byIds[_id];
    Vue.set(state.byIds, _id, {
      ...note,
      content,
    });
  },
  incrementSelectedNoteContentVersion(state) {
    state.selectedNote.contentVersion++;
  },
  setNotePermission(state, { _id, visibility, sharedUsers }) {
    const { byIds } = state;
    const note = byIds[_id];
    Vue.set(state.byIds, _id, {
      ...note,
      visibility,
      sharedUsers,
    });
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
  setNumOfAllUnviewedNotes(state, value) {
    state.numOfAllUnviewedNotes = value;
  },
  setSharedNotes(state, sharedNotes) {
    const allSharedIds = [];
    const sharedByIds = {};
    const byIds = {};
    sharedNotes.forEach((sharedNote) => {
      const note = sharedNote.note;
      allSharedIds.push(note._id);
      byIds[note._id] = note;
      sharedByIds[note._id] = sharedNote;
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
    state.sharedByIds[note._id] = sharedNote;
  },
  setShowCreateNoteModal(state, value) {
    state.showCreateNoteModal = value;
  },
  setNewNoteParent(state, parent) {
    state.newNoteParent = parent;
  },
  appendNoteToTab(state, { _id }) {
    if (state.noteTabIds.some((id) => id === _id)) {
      return;
    }
    state.noteTabIds.push(_id);
    currUserPref.appendNoteTabId(_id);
  },
  deleteNoteFromTab(state, { _id }) {
    const index = state.noteTabIds.indexOf(_id);
    if (index >= 0) {
      state.noteTabIds.splice(index, 1);
      currUserPref.removeNoteTabId(_id);
    }
  },
  setNoteTabIds(state, payload) {
    state.noteTabIds = payload;
  },
  setMyNoteSearchKeyword(state, keyword) {
    state.myNoteSearchKeyword = keyword;
  },
  setShowNavigateNoteWidget(state, value) {
    state.showNavigateNoteWidget = value;
  },
  setSearchNavigateKeyword(state, keyword) {
    state.searchNavigateKeyword = keyword;
  },
  setSelectedNavigateNoteWidgetIndex(state, value) {
    state.selectedNavigateNoteWidgetIndex = value;
  },
  incSelectedNavigateNoteWidgetIndex(state) {
    state.selectedNavigateNoteWidgetIndex++;
  },
  decSelectedNavigateNoteWidgetIndex(state) {
    state.selectedNavigateNoteWidgetIndex--;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
