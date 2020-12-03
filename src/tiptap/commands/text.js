export function getSelectedText(editor) {
  const { state } = editor;
  const { from, to } = state.selection;
  let text = '';
  state.doc.nodesBetween(from, to, (node) => {
    if (node.isText) {
      text += node.text;
    }
  });
  return text;
}
