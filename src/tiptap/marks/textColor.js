import { Mark } from 'tiptap';
import { MARK_TEXT_COLOR } from './names';

export function getTextColor(state) {
  const { selection, schema } = state;
  const { $to } = selection;
  const { marks } = schema;

  const textColorMark = marks[MARK_TEXT_COLOR];

  let color = null;

  const startNode = $to.nodeBefore;

  if (startNode) {
    const colorMark = startNode.marks.find((mark) => mark.type === textColorMark);
    if (colorMark) {
      color = colorMark.attrs.color;
    }
  }

  return color;
}

export class TextColor extends Mark {
  get name() {
    return MARK_TEXT_COLOR;
  }

  get schema() {
    return {
      attrs: {
        color: '',
      },
      inline: true,
      group: 'inline',
      parseDOM: [
        {
          style: 'color',
          getAttrs: color => {
            return {
              color,
            };
          },
        },
      ],
      toDOM(node) {
        const { color } = node.attrs;
        let style = '';
        if (color) {
          style += `color: ${color};`;
        }
        return ['span', { style }, 0];
      },
    };
  }

  commands({ type }) {
    const markApplies = (doc, ranges, type) => {
      for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i];
        let can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false;
        doc.nodesBetween($from.pos, $to.pos, (node) => {
          if (can) {
            return false;
          }
          can = node.inlineContent && node.type.allowsMarkType(type);
        })
        if (can) {
          return true;
        }
      }
      return false;
    };

    return (attrs) => {
      return (state, dispatch) => {
        let { empty, $cursor, ranges } = state.selection;
        if ((empty && !$cursor) || !markApplies(state.doc, ranges, type)) return false
        if (dispatch) {
          if ($cursor) {
            if (type.isInSet(state.storedMarks || $cursor.marks())) {
              dispatch(state.tr.removeStoredMark(type));
            } else {
              dispatch(state.tr.addStoredMark(type.create(attrs)));
            }
          } else {
            let has = false, tr = state.tr;
            for (let i = 0; !has && i < ranges.length; i++) {
              let { $from, $to } = ranges[i];
              has = state.doc.rangeHasMark($from.pos, $to.pos, type);
            }
            for (let i = 0; i < ranges.length; i++) {
              let { $from, $to } = ranges[i];
              if (has) {
                tr.removeMark($from.pos, $to.pos, type);
              }
              tr.addMark($from.pos, $to.pos, type.create(attrs));
            }
            dispatch(tr.scrollIntoView());
          }
        }
        return true;
      };
    };
  }
}
