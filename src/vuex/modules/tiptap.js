const state = {
  dropdown: null,
  menubar: null,
  position: {
    top: undefined,
    left: undefined,
  },
  selection: {},
};

const getters = {
  dropdown: state => state.dropdown,
  setMenubar: state => state.menubar,
  tableMenuPosition: state => state.position,
  selection: state => state.selection,
};

const actions = {

};

const mutations = {
  setDropdown(state, el) {
    state.dropdown = el;
  },
  setMenubar(state, el) {
    state.menubar = el;
  },
  setPosition(state, { top, left, menuDirection }) {
    state.position = { top, left, menuDirection };
  },
  setEditorSelection(state, payload) {
    state.selection = payload;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
