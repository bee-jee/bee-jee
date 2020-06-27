export const getNotesState = (store) => store.notes;

export const getNoteById = (store, id) =>
  getNotesState(store) ? { ...getNotesState(store).byIds[id] } : {};

export const getSelectedNoteId = (store) =>
  getNotesState(store) ? getNotesState(store).selectedNoteId : '';

export const getToDeleteNoteId = (store) =>
  getNotesState(store) ? getNotesState(store).toDeleteNoteId : '';

export const getSelectedNote = (store) =>
  getSelectedNoteId(store) ? getNoteById(store, getSelectedNoteId(store)) : {};

export const getToDeleteNote = (store) =>
  getToDeleteNoteId(store) ? getNoteById(store, getToDeleteNoteId(store)) : { _id: '' };

export const getNotes = (store) =>
  getNotesState(store) ? getNotesState(store).allIds.map((id) => getNoteById(store, id)) : [];

export const getIsLoading = (store) =>
  getNotesState(store) ? getNotesState(store).isLoading : false;

export const getIsSyncing = (store) =>
  getNotesState(store) ? getNotesState(store).isSyncing : false;
