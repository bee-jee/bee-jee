import mongoose from 'mongoose';
import 'dotenv/config';
import {
  Text, XmlText, XmlFragment, XmlElement,
} from 'yjs';
import validateEnv from '../utils/env';
import NoteModel from '../note/note.model';
import { decodeDoc, encodeDoc } from '../../../common/collab';

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_PATH,
} = validateEnv();
let uri = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`;
if (typeof MONGO_USER === 'undefined' || MONGO_USER === '') {
  uri = `mongodb://${MONGO_PATH}`;
}

function toXmlElements(root: XmlFragment, type: Text) {
  // @ts-ignore
  let offset = 0;
  type.toDelta().forEach((delta: any) => {
    const contentNode = new XmlText();
    contentNode.applyDelta([delta]);
    const paragraph = new XmlElement('paragraph');
    root.insert(offset, [paragraph]);
    offset += 1;
    paragraph.insert(0, [contentNode]);
  });
}

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then((connection) => {
    (async () => {
      const notes = await NoteModel.find({});
      const promises: Promise<void>[] = [];
      notes.forEach((note) => {
        const doc = decodeDoc(note.content || '');
        const text = doc.getText('text');
        if (text.length === 0) {
          return;
        }
        const xmlContent = doc.getXmlFragment('xmlContent');
        xmlContent.delete(0, xmlContent.length);
        toXmlElements(xmlContent, text);
        note.content = encodeDoc(doc);
        promises.push((async () => {
          await note.save();
        })());
      });
      await Promise.all(promises);
    })()
      .finally(() => {
        connection.disconnect();
      });
  });
