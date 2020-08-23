import { Extension } from 'tiptap';
import { ySyncPlugin } from 'y-prosemirror';

export default class Realtime extends Extension {
  constructor(note) {
    super();
    this.note = note;
  }

  get name() {
    return 'realtime';
  }

  get plugins() {
    return [
      ySyncPlugin(this.note.content.getXmlFragment('xmlContent')),
    ];
  }
}
