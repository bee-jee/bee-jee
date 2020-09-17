import { Node } from 'tiptap';
import { LIST_ITEM } from './names';
import { isAlign } from './paragraph';
import { splitListItem } from 'tiptap-commands';

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

      content: 'paragraph block*',

      parseDOM: [{ tag: 'li', getAttrs }],

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
    };
  }
}
