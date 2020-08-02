import { XmlElement, XmlText } from 'yjs';

export default {
  methods: {
    getNoteContent(note) {
      return getNoteContent(note);
    },
  },
};

function getXmlText(xml) {
  if (xml instanceof XmlElement) {
    return xml.toArray().map((child) => getXmlText(child)).join('');
  } else if (xml instanceof XmlText) {
    return xml.toString();
  }
  return '';
}

export function getNoteContent(note) {
  if (!note || !note.content) {
    return '';
  }
  return note.content.getXmlFragment('xmlContent').toArray().map(getXmlText).join('');
}
