import { Extension, Plugin } from "tiptap";
import { Decoration, DecorationSet } from 'prosemirror-view';
import { setMeta } from "y-prosemirror";

const selectionPlaceholderKey = 'selectionPlaceholder';

export default class SelectionPlaceholder extends Extension {
  get name() {
    return 'selectionPlaceholder';
  }

  get plugins() {
    const { store } = this.options;
    return [
      new Plugin({
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, old) => {
            const cursorMeta = tr.getMeta(selectionPlaceholderKey);
            if (cursorMeta && cursorMeta.updated) {
              try {
                return this.createDecorations(tr.doc, cursorMeta.selection);
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
          const unsubscribe = store.subscribe((mutation) => {
            switch (mutation.type) {
              case 'setEditorSelection': {
                const { from, to } = mutation.payload;
                setMeta(view, selectionPlaceholderKey, {
                  updated: true,
                  selection: {
                    from,
                    to,
                  },
                });
                break;
              }
            }
          });
          return {
            destroy: () => {
              unsubscribe();
            },
          };
        },
      }),
    ];
  }

  createDecorations(doc, selection) {
    const decorations = [
      Decoration.inline(
        selection.from,
        selection.to,
        {
          class: 'selection-placeholder',
        },
      ),
    ];
    return DecorationSet.create(doc, decorations);
  }
}
