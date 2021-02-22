import { Extension } from 'tiptap';

export default class ForwardHotkeys extends Extension {
  constructor(store) {
    super();
    this.store = store;
  }

  get name() {
    return 'forward-hotkeys';
  }

  keys() {
    return {
      'Ctrl-p': () => {
        this.store.commit('setShowNavigateNoteWidget', true);
        return true;
      },
    }
  }
}
