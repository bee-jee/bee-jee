import { MARK_TEXT_COLOR } from "../marks/names";

export function getTextColor(state) {
  const { selection, schema } = state;
  const { $from } = selection;
  const { marks } = schema;

  const textColorMark = marks[MARK_TEXT_COLOR];

  let color = null;

  const start = $from.parent.childAfter($from.parentOffset);

  if (start.node) {
    const colorMark = start.node.marks.find((mark) => mark.type === textColorMark);
    if (colorMark) {
      color = colorMark.attrs.color;
    }
  }

  return color;
}
