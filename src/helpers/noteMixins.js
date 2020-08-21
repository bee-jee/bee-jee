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

function toPartialArray(fragment, length) {
  const contents = [];
  let node = fragment._start;
  while (node !== null && length > 0) {
    if (node.countable && !node.deleted) {
      const content = node.content.getContent();
      for (let i = 0; i < content.length; i++) {
        contents.push(content[i]);
      }
    }
    node = node.right;
    length--;
  }
  return contents;
}

export function getNoteContent(note) {
  if (!note || !note.content) {
    return '';
  }
  return toPartialArray(note.content.getXmlFragment('xmlContent'), 5)
    .map(getXmlText).join('');
}
