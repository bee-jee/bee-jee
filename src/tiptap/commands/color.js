import { BLOCKQUOTE, HEADING, LIST_ITEM, PARAGRAPH } from "../nodes/names";

export function setTextColor(tr, schema, newColor) {
  const { selection, doc } = tr;
  if (!selection || !doc) {
    return tr;
  }
  const { from, to } = selection;
  const { nodes } = schema;

  const blockquote = nodes[BLOCKQUOTE];
  const listItem = nodes[LIST_ITEM];
  const heading = nodes[HEADING];
  const paragraph = nodes[PARAGRAPH];

  const tasks = [];
  const allowedNodeTypes = new Set([blockquote, heading, listItem, paragraph]);

  doc.nodesBetween(from, to, (node, pos) => {
    const nodeType = node.type;
    const color = node.attrs.color || null;
    if (color !== newColor && allowedNodeTypes.has(nodeType)) {
      tasks.push({
        node,
        pos,
        nodeType,
      });
    }
    return true;
  });

  if (!tasks.length) {
    return tr;
  }

  tasks.forEach((job) => {
    const { node, pos, nodeType } = job;
    let { attrs } = node;
    attrs = {
      ...attrs,
      color: newColor,
    };
    tr = tr.setNodeMarkup(pos, nodeType, attrs, node.marks);
  });

  return tr;
}

export function getTextColor(state) {
  const { selection, schema, doc } = state;
  const { from, to } = selection;
  const { nodes } = schema;

  const blockquote = nodes[BLOCKQUOTE];
  const listItem = nodes[LIST_ITEM];
  const heading = nodes[HEADING];
  const paragraph = nodes[PARAGRAPH];
  
  const allowedNodeTypes = new Set([blockquote, heading, listItem, paragraph]);
  let color = null;
  
  doc.nodesBetween(from, to, (node) => {
    if (allowedNodeTypes.has(node.type)) {
      color = node.attrs.color;
      return false;
    }
    return true;
  });

  return color;
}
