import toCSSLineSpacing from '../ui/toCSSLineSpacing';
import { Node } from 'tiptap';
import setTextAlign from '../commands/textAlign';
import { PARAGRAPH } from './names';
import { MIN_INDENT_LEVEL } from '../commands/indentation';
import { setTextColor } from '../commands/color';

// This assumes that every 36pt maps to one indent level.
export const INDENT_MARGIN_PT_SIZE = 36;
export const ATTRIBUTE_INDENT = 'data-indent';

export const EMPTY_CSS_VALUE = new Set(['', '0%', '0pt', '0px']);

export const isAlign = (value) => {
  value = value.toLowerCase();
  return value === 'left' || value === 'right' || value === 'center' || value === 'justify';
};


const indentToMarginLeft = (indent) => {
  return indent * INDENT_MARGIN_PT_SIZE;
}

const getAttrs = (dom) => {
  const {
    lineHeight,
    textAlign,
    paddingTop,
    paddingBottom,
  } = dom.style;

  let align = dom.getAttribute('align') || textAlign || '';
  align = isAlign(align) ? align : null;

  let indent = parseInt(dom.getAttribute(ATTRIBUTE_INDENT), 10);

  indent = indent || MIN_INDENT_LEVEL;

  const lineSpacing = lineHeight ? toCSSLineSpacing(lineHeight) : null;

  const id = dom.getAttribute('id') || '';
  return { align, indent, lineSpacing, paddingTop, paddingBottom, id };
};

const toDOM = (node) => {
  const {
    align,
    indent,
    lineSpacing,
    paddingTop,
    paddingBottom,
    id,
    color,
  } = node.attrs;
  const attrs = {};

  let style = '';
  if (align && align !== 'left') {
    style += `text-align: ${align};`;
  }

  if (lineSpacing) {
    const cssLineSpacing = toCSSLineSpacing(lineSpacing);
    style +=
      `line-height: ${cssLineSpacing};` +
      // This creates the local css variable `--czi-content-line-height`
      // that its children may apply.
      `--czi-content-line-height: ${cssLineSpacing}`;
  }

  if (paddingTop && !EMPTY_CSS_VALUE.has(paddingTop)) {
    style += `padding-top: ${paddingTop};`;
  }

  if (paddingBottom && !EMPTY_CSS_VALUE.has(paddingBottom)) {
    style += `padding-bottom: ${paddingBottom};`;
  }

  if (indent) {
    attrs[ATTRIBUTE_INDENT] = String(indent);
    style += `margin-left: ${indentToMarginLeft(indent)}pt`;
  }

  if (color) {
    style += `color: ${color}`;
  }

  style && (attrs.style = style);

  if (id) {
    attrs.id = id;
  }

  return ['p', attrs, 0];
};

export const toParagraphDOM = toDOM;
export const getParagraphNodeAttrs = getAttrs;

export const PragraphNodeSchema = {
  attrs: {
    align: { default: null },
    color: { default: null },
    id: { default: null },
    indent: { default: null },
    lineSpacing: { default: null },
    paddingBottom: { default: null },
    paddingTop: { default: null },
  },
  content: 'inline*',
  group: 'block',
  parseDOM: [{
    tag: 'p',
    getAttrs: getAttrs,
  }],
  toDOM: toDOM,
};

export class Paragraph extends Node {
  get name() {
    return PARAGRAPH;
  }

  get defaultOptions() {
    return {
      align: ['left', 'right', 'center', 'justify'],
    };
  }

  get schema() {
    return PragraphNodeSchema;
  }

  commands() {
    return (attrs) => (state, dispatch) => {
      const { schema, selection } = state;
      let tr = {};
      if ('align' in attrs) {
        tr = setTextAlign(state.tr.setSelection(selection), schema, attrs.align);
      }
      if ('color' in  attrs) {
        tr = setTextColor(state.tr.setSelection(selection), schema, attrs.color);
      }
      if (tr.docChanged) {
        dispatch && dispatch(tr);
        return true;
      } else {
        return false;
      }
    };
  }
}
