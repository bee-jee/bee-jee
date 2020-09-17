// import { TextSelection } from 'tiptap';
import { liftListItem, sinkListItem } from 'tiptap-commands';
import { LIST_ITEM, PARAGRAPH, TAB } from '../nodes/names';

export const MIN_INDENT_LEVEL = 0;
export const MAX_INDENT_LEVEL = 7;

export function increaseIndent({ schema }) {
  const { nodes } = schema;
  const listItem = nodes[LIST_ITEM];
  const paragraph = nodes[PARAGRAPH];
  const tab = nodes[TAB];
  const sink = sinkListItem(listItem);

  return (state, dispatch) => {
    if (sink(state, dispatch)) {
      return true;
    }
    let { tr } = state;
    const { doc, selection } = tr;
    if (!doc || !selection) {
      return false;
    }
    const { $from, $to } = selection;
    if (
      $from.pos === $to.pos) {
      if ($from.parent.type === paragraph && $from.nodeBefore === null) {
        doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
          if (node.type === paragraph) {
            const indent = clamp(
              MIN_INDENT_LEVEL,
              (node.attrs.indent || 0) + 1,
              MAX_INDENT_LEVEL
            );
            tr = tr.setNodeMarkup(pos, node.type, {
              ...node.attrs,
              indent,
            }, node.marks);
          }
        });
      } else {
        tr = tr.replaceSelectionWith(tab.create());
      }
    } else {
      doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type === paragraph) {
          const indent = clamp(
            MIN_INDENT_LEVEL,
            (node.attrs.indent || 0) + 1,
            MAX_INDENT_LEVEL
          );
          tr = tr.setNodeMarkup(pos, node.type, {
            ...node.attrs,
            indent,
          }, node.marks);
        }
      });
    }
    if (tr.docChanged) {
      dispatch && dispatch(tr.scrollIntoView());
      return true;
    }
    return false;
  };
}

export function decreaseIndent({ schema }) {
  const { nodes } = schema;
  const listItem = nodes[LIST_ITEM];
  const paragraph = nodes[PARAGRAPH];
  const lift = liftListItem(listItem);

  return (state, dispatch) => {
    if (lift(state, dispatch)) {
      return true;
    }
    let { tr } = state;
    const { doc, selection } = tr;
    if (!doc || !selection) {
      return false;
    }
    const { $from, $to } = selection;
    if (
      ($from.pos === $to.pos)
      && $from.parent.type === paragraph
      && $from.nodeBefore === null
    ) {
      doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type === paragraph) {
          const indent = clamp(
            MIN_INDENT_LEVEL,
            (node.attrs.indent || 0) - 1,
            MAX_INDENT_LEVEL
          );
          tr = tr.setNodeMarkup(pos, node.type, {
            ...node.attrs,
            indent,
          }, node.marks);
        }
      });
    }
    if (tr.docChanged) {
      dispatch && dispatch(tr.scrollIntoView());
      return true;
    }
    return false;
  }
}

function clamp(min, val, max) {
  if (val < min) {
    return min;
  }
  if (val > max) {
    return max;
  }
  return val;
}
