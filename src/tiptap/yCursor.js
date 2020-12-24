import { Extension } from 'tiptap';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin } from 'prosemirror-state';
import {
  yCursorPluginKey,
  ySyncPluginKey,
  setMeta,
} from 'y-prosemirror';
import { relativeCoordsAt } from './utils/coords';

const defaultCursorBuilder = ({ user, head, view }) => {
  const { left, top, bottom } = relativeCoordsAt(view, head);
  const width = 2;
  const height = bottom - top;
  const { color, name } = user;
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

export const createDecorations = (state, awareness, view, createCursor) => {
  const ystate = ySyncPluginKey.getState(state);
  const y = ystate.doc;
  const decorations = [];
  if (ystate.snapshot != null || ystate.prevSnapshot != null || ystate.binding === null) {
    return DecorationSet.create(state.doc, []);
  }
  awareness.getStates().forEach((aw, clientId) => {
    if (clientId === y.clientID) {
      return;
    }
    if (aw.cursor != null) {
      const user = aw.user || {};
      if (user.color == null) {
        user.color = '#ffa500';
      }
      if (user.name == null) {
        user.name = `User: ${clientId}`;
      }
      let { anchor, head } = aw.cursor;
      if (anchor !== null && head !== null) {
        const maxsize = Math.max(state.doc.content.size - 1, 0);
        anchor = Math.min(anchor, maxsize);
        head = Math.min(head, maxsize);
        decorations.push(Decoration.widget(head, () => createCursor({
          user,
          anchor,
          head,
          view,
        }), { key: clientId + '', side: 10 }));
        const from = Math.min(anchor, head);
        const to = Math.max(anchor, head);
        decorations.push(
          Decoration.inline(
            from,
            to,
            { style: `background-color: ${user.color}70` },
            { inclusiveEnd: true, inclusiveStart: false },
          ),
        );
      }
    }
  });
  return DecorationSet.create(state.doc, decorations);
};

const yCursorPlugin = (
  awareness,
  { cursorBuilder = defaultCursorBuilder, getSelection = (state) => state.selection } = {},
  cursorStateField = 'cursor',
) => {
  return new Plugin({
    key: yCursorPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, prevState, oldState, newState) {
        const yCursorState = tr.getMeta(yCursorPluginKey);
        if (yCursorState && yCursorState.awarenessUpdated) {
          return createDecorations(newState, awareness, yCursorState.view, cursorBuilder);
        }
        return prevState.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations: (state) => {
        return yCursorPluginKey.getState(state);
      },
    },
    view: (view) => {
      const awarenessListener = () => {
        if (view.docView) {
          setMeta(view, yCursorPluginKey, { view, awarenessUpdated: true });
        }
      };
      const updateCursorInfo = () => {
        if (!view.hasFocus()) {
          awareness.setLocalStateField(cursorStateField, null);
          return;
        }

        const selection = getSelection(view.state);
        const { anchor, head } = selection;

        awareness.setLocalStateField(cursorStateField, { anchor, head });
      };
      awareness.on('change', awarenessListener);
      return {
        update: updateCursorInfo,
        destroy: () => {
          awareness.off('change', awarenessListener);
          awareness.setLocalStateField(cursorStateField, null);
        },
      };
    },
  });
};

export default class Cursor extends Extension {
  get name() {
    return 'cursor';
  }

  get plugins() {
    const {
      awareness,
    } = this.options;

    return [
      yCursorPlugin(awareness),
    ];
  }
}
