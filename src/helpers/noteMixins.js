export default {
  methods: {
    getNoteContent(note) {
      return getNoteContent(note);
    },
  },
};

export function getNoteContent(note) {
  if (!note || !note.content) {
    return '';
  }
  return note.content.getText('text').toString();
}
