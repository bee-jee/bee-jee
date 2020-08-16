import { Extension, Plugin } from 'tiptap';
import { Decoration, DecorationSet } from 'prosemirror-view';
import tinycolor from 'tinycolor2';

const cursorBuilder = ({ color, name, left, top, width, height }) => {
  const userDiv = document.createElement('div');
  userDiv.setAttribute('style', `background-color: ${color}`);
  userDiv.insertBefore(document.createTextNode(name), null);
  const cursor = document.createElement('div');
  cursor.style.backgroundColor = color;
  cursor.style.position = 'fixed';
  cursor.style.left = `${left}px`;
  cursor.style.top = `${top}px`;
  cursor.style.width = `${width}px`;
  cursor.style.height = `${height}px`;
  cursor.classList.add('user-cursor');
  cursor.insertBefore(userDiv, null);
  return cursor;
};

const cursorPluginKey = 'cursorPlugin';

export default class Cursor extends Extension {
  constructor() {
    super(...arguments);
    this.cursors = new Map();
  }

  get name() {
    return 'cursor';
  }

  get plugins() {
    const { store, note } = this.options;
    return [
      new Plugin({
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, old) => {
            const cursorMeta = tr.getMeta(cursorPluginKey);
            if (cursorMeta && cursorMeta.updated) {
              try {
                return this.createDecorations(tr.doc, cursorMeta.view);
              } catch (err) {
                return old;
              }
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
        view: (view) => {
          const setMeta = (key, value) => {
            const { tr } = view.state;
            tr.setMeta(key, value);
            view.dispatch(tr);
          };
          const unsubscribe = store.subscribe((mutation) => {
            switch (mutation.type) {
              case 'appendUserCursor': {
                const { id, name, index, length, color } = mutation.payload;
                this.createCursor(id, name, color);
                if (index !== undefined && length !== undefined) {
                  this.moveCursor(id, {
                    index,
                    length,
                  });
                }
                setMeta(cursorPluginKey, { view, updated: true });
                break;
              }
              case 'removeUserCursor': {
                const { id } = mutation.payload;
                this.removeCursor(id);
                setMeta(cursorPluginKey, { view, updated: true });
                break;
              }
              case 'updateUserCursor': {
                const { id, index, length } = mutation.payload;
                this.moveCursor(id, {
                  index,
                  length,
                });
                setMeta(cursorPluginKey, { view, updated: true });
                break;
              }
            }
          });
          const updateCursor = () => {
            if (!view.hasFocus()) {
              store.dispatch('changeCursor', {
                note,
                index: undefined,
                length: undefined,
              });
              return;
            }
            const { selection } = view.state;
            const { anchor, head } = selection;
            const index = anchor;
            const length = head - anchor;
            store.dispatch('changeCursor', {
              note, index, length,
            });
          };
          return {
            update: updateCursor,
            destroy: () => {
              unsubscribe();
            },
          };
        },
      }),
    ];
  }

  createCursor(id, name, color) {
    this.cursors.set(id, {
      name, color,
      index: 0,
      length: 0,
    });
  }

  removeCursor(id) {
    this.cursors.delete(id);
  }

  moveCursor(id, { index, length }) {
    const cursor = this.cursors.get(id);
    if (cursor) {
      cursor.index = index;
      cursor.length = length;
    }
  }

  createDecorations(doc, view) {
    const decorations = [];
    this.cursors.forEach((value, key) => {
      const { index, length, color, name } = value;
      if (index === undefined) {
        return;
      }
      const from = index;
      const to = index + length;
      const { left, top, bottom } = view.coordsAtPos(to);
      decorations.push(Decoration.widget(
        to,
        () => cursorBuilder({ color, name, left, top, width: 3, height: bottom - top }),
        { key, side: 10 },
      ));
      decorations.push(Decoration.inline(Math.min(from, to), Math.max(from, to), {
        style: `background-color: ${tinycolor(color).setAlpha(0.3).toString()}`,
      }, { inclusiveStart: true, inclusiveEnd: true }));
    });
    return DecorationSet.create(doc, decorations);
  }
}