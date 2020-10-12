import { decreaseIndent } from "../commands/indentation";
import { PARAGRAPH } from "../nodes/names";

export function paragraphBackspace({ schema }) {
  const { nodes } = schema;
  const paragraph = nodes[PARAGRAPH];
  const decrease = decreaseIndent({ schema });
  
  return (state, dispatch) => {
    const { tr } = state;
    const { selection } = tr;
    const { $from, $to } = selection;
    if (
      $from === $to
      && selection.$from.nodeAfter === selection.$from.nodeBefore
      && selection.$from.noteAfter == null
      && selection.$from.parent.type === paragraph
      && selection.$from.parent.attrs.indent > 0
    ) {
      return decrease(state, dispatch);
    }
  };
}
