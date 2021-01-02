import { Extension, Plugin } from 'tiptap';
import { Decoration, DecorationSet } from 'prosemirror-view';
import tinycolor from 'tinycolor2';
import { setMeta, ySyncPluginKey } from 'y-prosemirror';
import { relativeCoordsAt } from './utils/coords';

const cursorBuilder = ({ color, name, left, top, width, height }) => {
  const userDiv = document.createElement('div');
  userDiv.classList.add('d-none');
  userDiv.setAttribute('style', `background-color: ${color}`);
  userDiv.insertBefore(document.createTextNode(name), null);
  const cursor = document.createElement('div');
  cursor.style.backgroundColor = color;
  cursor.style.position = 'absolute';
  cursor.style.left = `${left}px`;
  cursor.style.top = `${top}px`;
  cursor.style.width = `${width}px`;
  cursor.style.height = `${height}px`;
  cursor.classList.add('user-cursor');
  cursor.insertBefore(userDiv, null);
  let timeout = null;
  cursor.onmouseover = () => {
    cursor.classList.add('hover');
    userDiv.classList.remove('d-none');
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  cursor.onmouseout = () => {
    timeout = setTimeout(() => {
      cursor.classList.remove('hover');
      userDiv.classList.add('d-none');
    }, 1500);
  };
  return cursor;
};

const cursorPluginKey = 'cursorPlugin';

export default class Cursor extends Extension {
  get name() {
    return 'cursor';
  }

  get plugins() {
    const { awareness } = this.options;
    return [
      new Plugin({
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, old, prevState, newState) => {
            const cursorMeta = tr.getMeta(cursorPluginKey);
            if (cursorMeta && cursorMeta.updated) {
              try {
                return this.createDecorations(newState, awareness, cursorMeta.view);
              } catch (err) {
                console.error(err);
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
          const awarenessListener = () => {
            if (view.docView) {
              setMeta(view, cursorPluginKey, { view, updated: true });
            }
          };
          const updateCursor = () => {
            if (!view.editable) {
              return;
            }
            if (!view.hasFocus()) {
              awareness.setLocalStateField('cursor', null);
              return;
            }
            const { selection } = view.state;
            const { anchor, head } = selection;
            awareness.setLocalStateField('cursor', { anchor, head });
          };
          awareness.on('change', awarenessListener);
          return {
            update: updateCursor,
            destroy: () => {
              awareness.off('change', awarenessListener);
              awareness.setLocalStateField('cursor', null);
            },
          };
        },
      }),
    ];
  }

  createDecorations(state, awareness, view) {
    const ystate = ySyncPluginKey.getState(state);
    const y = ystate.doc;
    const decorations = [];
    awareness.getStates().forEach((aw, clientID) => {
      if (clientID === y.clientID || !aw.cursor || !aw.user) {
        return;
      }
      const { anchor, head } = aw.cursor;
      const { name, color } = aw.user;
      let { left, top, bottom } = relativeCoordsAt(view, head);
      decorations.push(Decoration.widget(
        head,
        () => cursorBuilder({ color, name, left, top, width: 2, height: bottom - top }),
        { side: -1 },
      ));
      decorations.push(Decoration.inline(Math.min(anchor, head), Math.max(anchor, head), {
        style: `background-color: ${tinycolor(color).setAlpha(0.3).toString()}`,
      }, { inclusiveStart: false, inclusiveEnd: true }));
    });
    return DecorationSet.create(state.doc, decorations);
  }
}
