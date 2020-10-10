import { Extension, Plugin } from 'tiptap';
import { mdiBorderColor } from '@mdi/js';
import findActionableCell from './utils/table';
import store from '../vuex/store';

function fromHTMlElement(el) {
  const display = document.defaultView.getComputedStyle(el).display;
  if (display === 'contents' && el.children.length === 1) {
    // el has no layout at all, use its children instead.
    return fromHTMlElement(el.children[0]);
  }
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    w: rect.width,
    h: rect.height,
  };
}

function isElementFullyVisible(el) {
  const { x, y, w, h } = fromHTMlElement(el);
  // Only checks the top-left point.
  const nwEl = w && h ? el.ownerDocument.elementFromPoint(x + 1, y + 1) : null;

  if (!nwEl) {
    return false;
  }

  if (nwEl === el) {
    return true;
  }

  if (el.contains(nwEl)) {
    return true;
  }

  return false;
}

function createIcon(path) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('mt-icon');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');

  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.setAttribute('d', path);
  svg.appendChild(pathEl);

  return svg;
}

class TableCellTooltipView {
  constructor(view) {
    this.cellElement = null;
    this.popUp = document.createElement('span');
    this.popUp.classList.add('table-cell-tooltip');
    this.popUp.style.position = 'absolute';
    this.popUp.appendChild(createIcon(mdiBorderColor));
    this.popUp.addEventListener('click', this.openTableMenu);
    view.dom.parentNode.appendChild(this.popUp);

    this.dropdown = store.getters.dropdown;
    this.menubar = store.getters.menubar;

    this.update(view, null);
    this.view = view;
  }

  update(view, lastState) {
    const { state, readOnly } = view;
    if (lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection)) {
      return;
    }
    const result = findActionableCell(state);

    if (!result || readOnly) {
      this.hide();
      return;
    }

    const domFound = view.domAtPos(result.pos + 1);
    if (!domFound) {
      this.hide();
      return;
    }

    let cellEl = domFound.node;
    const popUp = this.popUp;

    if (cellEl && !isElementFullyVisible(cellEl)) {
      cellEl = null;
    }

    if (!cellEl) {
      // Closes the popup.
      this.hide();
      this.cellElement = null;
    } else if (popUp && cellEl === this.cellElement) {
      this.showTo(view, cellEl);
    } else {
      this.hide();
      this.cellElement = cellEl;
      this.showTo(view, cellEl);
    }
  }

  hide = () => {
    this.popUp.style.display = 'none';
  };

  showTo = (view, el) => {
    this.popUp.style.display = 'block';
    const rootDom = view.dom.parentNode;
    let left = el.offsetLeft;
    let top = el.offsetTop;
    let parent = el.offsetParent;
    while (parent !== rootDom && parent !== null) {
      left += parent.offsetLeft;
      top += parent.offsetTop;
      parent = parent.offsetParent;
    }
    left += el.offsetWidth - this.popUp.offsetWidth;
    this.popUp.style.left = `${left - 8}px`;
    this.popUp.style.top = `${top + 3}px`;
  };

  openTableMenu = () => {
    this.dropdown.show();
    const top = this.popUp.offsetTop;
    let left = this.popUp.offsetLeft + this.popUp.offsetWidth + 3;
    const toggle = this.dropdown.$refs.toggle;
    let parent = toggle.offsetParent;
    while (parent !== null && !parent.classList.contains('note-editor-container')) {
      left -= parent.offsetLeft;
      parent = parent.offsetParent;
    }
    store.commit('setPosition', { top, left });
  };
}

class TableCellMenu extends Extension {
  get name() {
    return 'tablecell';
  }

  get plugins() {
    return [
      new Plugin({
        view: (view) => new TableCellTooltipView(view),
      }),
    ];
  }
}

export default TableCellMenu;
