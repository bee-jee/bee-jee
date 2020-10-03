import { Extension } from 'tiptap';
import {
  createNodeIfNotExists,
  relativePositionToAbsolutePosition,
  ySyncPlugin,
  ProsemirrorBinding,
} from 'y-prosemirror';
import * as prosemirrorState from 'prosemirror-state';
import * as PModel from 'prosemirror-model';
import * as Y from 'yjs';

/**
 * @param {any} tr
 * @param {any} relSel
 * @param {ProsemirrorBinding} binding
 */
const restoreRelativeSelection = (tr, relSel, binding) => {
  if (relSel !== null && relSel.anchor !== null && relSel.head !== null) {
    const anchor = relativePositionToAbsolutePosition(binding.doc, binding.type, relSel.anchor, binding.mapping);
    const head = relativePositionToAbsolutePosition(binding.doc, binding.type, relSel.head, binding.mapping);
    if (anchor !== null && head !== null) {
      tr = tr.setSelection(prosemirrorState.TextSelection.create(tr.doc, anchor, head));
    }
  }
};

export default class Realtime extends Extension {
  constructor(note) {
    super();
    this.note = note;
  }

  get name() {
    return 'realtime';
  }

  get plugins() {
    let changedInitialContent = false;
    const yXmlFragment = this.note.content.getXmlFragment('xmlContent');
    const syncPlugin = ySyncPlugin(yXmlFragment);
    // The below code block is to override the behaviour of ySyncPlugin
    // which removed a function call to `tr.scrollIntoView`. This is suspected
    // to be the reason that peers scroll to selection upon receiving updates
    const ySyncPluginKey = syncPlugin.spec.key;
    syncPlugin.spec.view = view => {
      const binding = new ProsemirrorBinding(yXmlFragment, view);
      binding._typeChanged = (events, transaction) => {
        const syncState = ySyncPluginKey.getState(this.prosemirrorView.state) || {};
        if (events.length === 0 || syncState.snapshot != null || syncState.prevSnapshot != null) {
          // drop out if snapshot is active
          this.renderSnapshot(syncState.snapshot, syncState.prevSnapshot);
          return
        }
        this.mux(() => {
          /**
           * @param {any} _
           * @param {Y.AbstractType} type
           */
          const delType = (_, type) => this.mapping.delete(type);
          Y.iterateDeletedStructs(transaction,
            transaction.deleteSet,
            struct => struct.constructor === Y.Item
              && this.mapping.delete(/** @type {Y.ContentType} */(/** @type {Y.Item} */ (struct).content).type));
          transaction.changed.forEach(delType);
          transaction.changedParentTypes.forEach(delType);
          const fragmentContent = this.type.toArray()
            .map(t => createNodeIfNotExists(/** @type {Y.XmlElement | Y.XmlHook} */(t),
              this.prosemirrorView.state.schema,
              this.mapping))
            .filter(n => n !== null);
          // @ts-ignore
          let tr = this.prosemirrorView.state.tr.replace(0, this.prosemirrorView.state.doc.content.size, new PModel.Slice(new PModel.Fragment(fragmentContent), 0, 0));
          restoreRelativeSelection(tr, this.beforeTransactionSelection, this);
          tr = tr.setMeta(ySyncPluginKey, { isChangeOrigin: true });
          this.prosemirrorView.dispatch(tr);
        });
      };
      // Make sure this is called in a separate context
      setTimeout(() => {
        binding._forceRerender();
        view.dispatch(view.state.tr.setMeta(ySyncPluginKey, { binding }));
      }, 0);
      return {
        update: () => {
          const pluginState = syncPlugin.getState(view.state);
          if (pluginState.snapshot == null && pluginState.prevSnapshot == null) {
            const emptySize = view.state.doc.type.createAndFill().content.size;
            if (changedInitialContent || view.state.doc.content.size > emptySize) {
              changedInitialContent = true;
              binding._prosemirrorChanged(view.state.doc);
            }
          }
        },
        destroy: () => {
          binding.destroy();
        }
      };
    };
    return [
      syncPlugin,
    ];
  }
}
