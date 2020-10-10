const state = {
  dropdown: null,
  menubar: null,
  position: {
    top: undefined,
    left: undefined,
  },
};

const getters = {
  dropdown: state => state.dropdown,
  setMenubar: state => state.menubar,
  tableMenuPosition: state => state.position,
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
  setPosition(state, { top, left }) {
    state.position = { top, left };
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
