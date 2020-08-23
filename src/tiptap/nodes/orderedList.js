import { Node } from 'tiptap';
import { ORDERED_LIST, LIST_ITEM } from './names';
import { MIN_INDENT_LEVEL, ATTRIBUTE_INDENT } from './paragraph';
import { ATTRIBUTE_LIST_STYLE_TYPE } from './listItem';
import { toggleList } from '../utils/list';

export const ATTRIBUTE_COUNTER_RESET = 'data-counter-reset';
export const ATTRIBUTE_FOLLOWING = 'data-following';
const AUTO_LIST_STYLE_TYPES = ['decimal', 'lower-alpha', 'lower-roman'];

export class OrderedList extends Node {
  get name() {
    return ORDERED_LIST;
  }

  get schema() {
    return {
      attrs: {
        id: { default: null },
        counterReset: { default: null },
        indent: { default: MIN_INDENT_LEVEL },
        following: { default: null },
        listStyleType: { default: null },
        name: { default: null },
        start: { default: 1 },
      },
      group: 'block',
      content: LIST_ITEM + '+',
      parseDOM: [
        {
          tag: 'ol',
          getAttrs(dom) {
            const listStyleType = dom.getAttribute(ATTRIBUTE_LIST_STYLE_TYPE);
            const counterReset =
              dom.getAttribute(ATTRIBUTE_COUNTER_RESET) || undefined;

            const start = dom.hasAttribute('start')
              ? parseInt(dom.getAttribute('start'), 10)
              : 1;

            const indent = dom.hasAttribute(ATTRIBUTE_INDENT)
              ? parseInt(dom.getAttribute(ATTRIBUTE_INDENT), 10)
              : MIN_INDENT_LEVEL;

            const name = dom.getAttribute('name') || undefined;

            const following = dom.getAttribute(ATTRIBUTE_FOLLOWING) || undefined;

            return {
              counterReset,
              following,
              indent,
              listStyleType,
              name,
              start,
            };
          },
        },
      ],
      toDOM(node) {
        const {
          start,
          indent,
          listStyleType,
          counterReset,
          following,
          name,
        } = node.attrs;
        const attrs = {
          [ATTRIBUTE_INDENT]: indent,
        };

        if (counterReset === 'none') {
          attrs[ATTRIBUTE_COUNTER_RESET] = counterReset;
        }

        if (following) {
          attrs[ATTRIBUTE_FOLLOWING] = following;
        }

        if (listStyleType) {
          attrs[ATTRIBUTE_LIST_STYLE_TYPE] = listStyleType;
        }

        if (start !== 1) {
          attrs.start = start;
        }

        if (name) {
          attrs.name = name;
        }

        let htmlListStyleType = listStyleType;

        if (!htmlListStyleType || htmlListStyleType === 'decimal') {
          htmlListStyleType =
            AUTO_LIST_STYLE_TYPES[indent % AUTO_LIST_STYLE_TYPES.length];
        }

        const cssCounterName = `czi-counter-${indent}`;

        attrs.style =
          `--czi-counter-name: ${cssCounterName};` +
          `--czi-counter-reset: ${following ? 'none' : start - 1};` +
          `--czi-list-style-type: ${htmlListStyleType}`;

        attrs.type = htmlListStyleType;

        return ['ol', attrs, 0];
      },
    };
  }

  commands({ type }) {
    return () => (state, dispatch) => {
      const { selection, schema } = state;
      let { tr } = state;
      if (!type) {
        return tr;
      }

      tr = toggleList(tr.setSelection(selection), schema, type);
      if (tr.docChanged) {
        dispatch && dispatch(tr);
        return true;
      } else {
        return false;
      }
    }
  }
}
