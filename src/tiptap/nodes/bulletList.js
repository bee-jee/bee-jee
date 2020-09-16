import { Node } from "tiptap";
import { BULLET_LIST, LIST_ITEM } from "./names";
import { toggleList } from "../utils/list";

export class BulletList extends Node {
  get name() {
    return BULLET_LIST;
  }

  get schema() {
    return {
      group: 'block',
      content: LIST_ITEM + '+',
      parseDOM: [
        {
          tag: 'ul',
        },
      ],

      toDOM() {
        return ['ul', 0];
      },
    };
  }

  commands({ type, schema }) {
    return () => (state, dispatch) => {
      const { selection } = state;
      let { tr } = state;

      tr = toggleList(tr.setSelection(selection), schema, type);
      if (tr.docChanged) {
        dispatch && dispatch(tr);
        return true;
      }
      return false;
    };
  }
}
