import { Node } from "tiptap";
import { decreaseIndent, increaseIndent } from "../commands/indentation";
import { TAB } from "./names";

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
    return {
      Tab: increaseIndent({ schema }),
      'Shift-Tab': decreaseIndent({ schema }),
    };
  }
}
