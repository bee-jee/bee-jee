import { Node } from 'tiptap';
import { decreaseIndent, increaseIndent } from '../commands/indentation';
import { tableBackspace, tableShiftTab, tableTab } from '../utils/table';
import { TAB } from './names';
import { paragraphBackspace } from '../utils/paragraph';

export const ATTRIBUTE_TYPE = 'data-type';

export class Tab extends Node {
  constructor(options) {
    super(options);

    const tabSize = (options && options.tabSize) || 4;
    this.tabContent = '';
    for (let i = 0; i < tabSize; i++) {
      this.tabContent += ' ';
    }
  }

  get name() {
    return TAB;
  }

  get schema() {
    const { tabContent } = this;

    return {
      inline: true,
      group: 'inline',
      parseDOM: [{
        tag: 'span',
        getAttrs: (dom) => {
          return dom.getAttribute(ATTRIBUTE_TYPE) === 'tab';
        },
      }],
      toDOM() {
        return ['span', {
          style: 'white-space: pre',
          [ATTRIBUTE_TYPE]: 'tab',
        }, tabContent];
      },
    };
  }

  keys({ schema }) {
    const handleParagraphBackspace = paragraphBackspace({ schema });
    const handleTableBackspace = tableBackspace({ schema });
    const handleTableTab = tableTab({ schema });
    const handleIncreaseIndent = increaseIndent({ schema });
    const handleTableShiftTab = tableShiftTab({ schema });
    const handleDecreaseIndent = decreaseIndent({ schema });

    return {
      Tab: (state, dispatch) => {
        if (handleTableTab(state, dispatch)) {
          return true;
        }
        return handleIncreaseIndent(state, dispatch);
      },
      'Shift-Tab': (state, dispatch) => {
        if (handleTableShiftTab(state, dispatch)) {
          return true;
        }
        return handleDecreaseIndent(state, dispatch);
      },
      Backspace: (state, dispatch) => {
        if (handleTableBackspace(state, dispatch)) {
          return true;
        }
        return handleParagraphBackspace(state, dispatch);
      },
    };
  }
}
