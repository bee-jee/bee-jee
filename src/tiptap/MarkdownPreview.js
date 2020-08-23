import marked from 'marked';
import { Extension, Plugin } from 'tiptap';
import { Decoration, DecorationSet } from 'prosemirror-view';

const getTokenLength = (token) => {
  return token.raw.length;
};

const blockToText = (block) => {
  let text = '\n';
  for (let i = 0; i < block.childCount; i++) {
    const child = block.content.content[i];
    text += nodeToText(child);
  }
  text += '\n';
  return text;
};

const nodeToText = (node) => {
  if (node.isBlock) {
    return blockToText(node);
  } else if (node.isText) {
    return node.text;
  }
}

const getDocTextWithFillings = (doc) => {
  return doc.content.content.map((node) => nodeToText(node)).join('');
};

const flattenTokens = (tokens) => {
  let flatten = [];
  tokens.forEach((token) => {
    if (token.type === 'paragraph') {
      flatten = flatten.concat(flattenTokens(token.tokens));
    } else {
      flatten.push(token);
    }
  });
  return flatten;
}

const tokensToRanges = (tokens) => {
  let start = 0;
  const ranges = [];
  flattenTokens(tokens).forEach((token) => {
    const end = start + getTokenLength(token);
    if (token.type !== 'text') {
      const range = {
        type: token.type,
        from: start + 1,
        to: end + 1,
      };
      ranges.push(range);
    }
    start = end;
  });
  return ranges;
};

export default class MarkdownPreview extends Extension {
  get name() {
    return 'markdown_preview';
  }

  createDecorations(doc) {
    const text = getDocTextWithFillings(doc);
    const ranges = tokensToRanges(marked.lexer(text));
    return DecorationSet.create(
      doc,
      ranges.map(({ from, to, type }) => {
        return Decoration.inline(from, to, {
          [`data-decor-${type}`]: true,
        });
      }),
    );
  }

  get plugins() {
    return [
      new Plugin({
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, old) => {
            if (tr.docChanged) {
              return this.createDecorations(tr.doc);
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  }
}
