import { Node } from 'tiptap';
import { PragraphNodeSchema, getParagraphNodeAttrs, toParagraphDOM } from './paragraph';
import { HEADING } from './names';
import toggleHeading from '../commands/heading';

const TAG_NAME_TO_LEVEL = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6,
};

class Heading extends Node {
  get name() {
    return HEADING;
  }

  get defaultOptions() {
    return {
      levels: Object.values(TAG_NAME_TO_LEVEL),
    };
  }

  get schema() {
    return {
      content: 'inline*',
      group: 'block',
      attrs: {
        ...PragraphNodeSchema.attrs,
        level: { default: 1 },
      },
      defining: true,
      parseDOM: Object.keys(TAG_NAME_TO_LEVEL)
        .map((tag) => ({ tag, getAttrs })),
      toDOM,
    };
  }

  commands() {
    return (attrs) => (state, dispatch) => {
      const { schema, selection } = state;
      const tr = toggleHeading(
        state.tr.setSelection(selection),
        schema,
        attrs.level
      );
      if (tr.docChanged) {
        dispatch && dispatch(tr);
        return true;
      } else {
        return false;
      }
    };
  }
}

const getAttrs = (dom) => {
  const attrs = getParagraphNodeAttrs(dom);
  const level = TAG_NAME_TO_LEVEL[dom.nodeName.toUpperCase()] || 1;
  attrs.level = level;
  return attrs;
};

const toDOM = (node) => {
  const dom = toParagraphDOM(node);
  const level = node.attrs.level || 1;
  dom[0] = `h${level}`;
  return dom;
};

export default Heading;
