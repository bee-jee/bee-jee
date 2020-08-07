import { Node } from 'tiptap';
import { LIST_ITEM } from './names';
import { isAlign } from './paragraph';
import { splitListItem, sinkListItem, liftListItem } from 'tiptap-commands';

export const ATTRIBUTE_LIST_STYLE_TYPE = 'data-list-style-type';

function getAttrs(dom) {
  const attrs = {};
  const { textAlign } = dom.style;
  let align = dom.getAttribute('data-align') || textAlign || '';
  align = isAlign(align) ? align : null;

  if (align) {
    attrs.align = align;
  }
  return attrs;
}

export class ListItem extends Node {
  get name() {
    return LIST_ITEM;
  }

  get schema() {
    return {
      attrs: {
        align: { default: null },
      },

      // NOTE:
      // This spec does not support nested lists (e.g. `'paragraph block*'`)
      // as content because of the complexity of dealing with indentation
      // (context: https://github.com/ProseMirror/prosemirror/issues/92).
      content: 'paragraph',

      parseDOM: [{ tag: 'li', getAttrs }],

      // NOTE:
      // This method only defines the minimum HTML attributes needed when the node
      // is serialized to HTML string. Usually this is called when user copies
      // the node to clipboard.
      // The actual DOM rendering logic is defined at `src/ui/ListItemNodeView.js`.
      toDOM(node) {
        const attrs = {};
        const { align } = node.attrs;
        if (align) {
          attrs['data-align'] = align;
        }
        return ['li', attrs, 0];
      },
    };
  }

  keys({ type }) {
    return {
      Enter: splitListItem(type),
      Tab: sinkListItem(type),
      'Shift-Tab': liftListItem(type),
    };
  }
}
