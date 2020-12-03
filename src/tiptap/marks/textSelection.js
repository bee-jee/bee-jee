import { Mark } from 'tiptap';
import { MARK_TEXT_SELECTION } from './names';

export default class TextSelection extends Mark {
  get name() {
    return MARK_TEXT_SELECTION;
  }

  get schema() {
    return {
      attrs: {
        id: '',
      },
      inline: true,
      group: 'inline',
      parseDOM: [
        {
          tag: 'czi-text-selection',
        },
      ],
      toDOM() {
        return ['czi-text-selection', { class: 'czi-text-selection' }, 0];
      },
    };
  }
}
