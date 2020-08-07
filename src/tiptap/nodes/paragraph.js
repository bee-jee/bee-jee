import toCSSLineSpacing from '../ui/toCSSLineSpacing';
import { Node } from 'tiptap';
import setTextAlign from '../commands/textAlign';
import { PARAGRAPH } from './names';

// This assumes that every 36pt maps to one indent level.
export const INDENT_MARGIN_PT_SIZE = 36;
export const MIN_INDENT_LEVEL = 0;
export const MAX_INDENT_LEVEL = 7;
export const ATTRIBUTE_INDENT = 'data-indent';

export const EMPTY_CSS_VALUE = new Set(['', '0%', '0pt', '0px']);

export const isAlign = (value) => {
  value = value.toLowerCase();
  return value === 'left' || value === 'right' || value === 'center' || value === 'justify';
};

const convertMarginLeftToIndentValue = (marginLeft) => {
  const ptValue = convertToCSSPTValue(marginLeft);
  return clamp(
    MIN_INDENT_LEVEL,
    Math.floor(ptValue / INDENT_MARGIN_PT_SIZE),
    MAX_INDENT_LEVEL
  );
};

const getAttrs = (dom) => {
  const {
    lineHeight,
    textAlign,
    marginLeft,
    paddingTop,
    paddingBottom,
  } = dom.style;

  let align = dom.getAttribute('align') || textAlign || '';
  align = isAlign(align) ? align : null;

  let indent = parseInt(dom.getAttribute(ATTRIBUTE_INDENT), 10);

  if (!indent && marginLeft) {
    indent = convertMarginLeftToIndentValue(marginLeft);
  }

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

  style && (attrs.style = style);

  if (indent) {
    attrs[ATTRIBUTE_INDENT] = String(indent);
  }

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
    // TODO: Add UI to let user edit / clear padding.
    paddingBottom: { default: null },
    // TODO: Add UI to let user edit / clear padding.
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
      const tr = setTextAlign(
        state.tr.setSelection(selection),
        schema,
        attrs.align
      );
      if (tr.docChanged) {
        dispatch && dispatch(tr);
        return true;
      } else {
        return false;
      }
    };
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

const SIZE_PATTERN = /([\d.]+)(px|pt)/i;

const PX_TO_PT_RATIO = 0.7518796992481203; // 1 / 1.33.

function convertToCSSPTValue(styleValue) {
  const matches = styleValue.match(SIZE_PATTERN);
  if (!matches) {
    return 0;
  }
  let value = parseFloat(matches[1]);
  const unit = matches[2];
  if (!value || !unit) {
    return 0;
  }
  if (unit === 'px') {
    value = PX_TO_PT_RATIO * value;
  }
  return value;
}
