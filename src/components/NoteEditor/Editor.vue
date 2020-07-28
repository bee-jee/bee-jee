<template>
  <div ref="editor"></div>
</template>

<script>
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import ImageResize from 'quill-image-resize';
import { ImageDrop } from 'quill-image-drop-module';

Quill.register('modules/cursors', QuillCursors);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/imageDrop', ImageDrop);

const options = {
  theme: 'snow',
  modules: {
    cursors: true,
    imageResize: {
      modules: ['DisplaySize', 'Resize'],
    },
    imageDrop: true,
  },
};

export default {
  props: {
    note: { type: Object },
    readOnly: { type: Boolean, default: false },
  },
  methods: {
    quillTextChange(delta, oldContents, source) {
      if (source === 'yjs') {
        return;
      }
      // update content
      const ops = delta.ops;
      this.$store.dispatch('changeNoteContent', {
        note: this.note,
        ops,
      });
    },
    quillSelectionChange(range) {
      this.$store.dispatch('changeCursor', {
        note: this.note,
        ...range,
      });
    },
    textObserver(event) {
      if (event.transaction.local) {
        return;
      }
      const delta = [];
      event.delta.forEach((d) => {
        if (d.insert !== undefined) {
          delta.push({
            ...d,
            attributes: {
              ...(d.attributes || {}),
            },
          });
        } else {
          delta.push(d);
        }
      });
      this.quill.updateContents(delta, 'yjs');
    },
  },
  mounted() {
    if (this.$refs.editor) {
      options.readOnly = this.readOnly;
      options.modules.toolbar = this.readOnly ? false : '#toolbar';
      this.quill = new Quill(this.$refs.editor, options);
      this.quillCursors = this.quill.getModule('cursors') || null;
      if (this.note !== undefined) {
        this.quill.setContents(this.note.content.getText('text').toDelta());
        this.note.content.getText('text').observe(this.textObserver);
      }
      this.quill.on('text-change', this.quillTextChange);
      this.quill.on('selection-change', this.quillSelectionChange);

      const cursors = this.quillCursors;
      this.$store.subscribe((mutation) => {
        switch (mutation.type) {
          case 'appendUserCursor': {
            const { id, name, index, length, color } = mutation.payload;
            cursors.createCursor(id, name, color);
            if (index !== undefined && length !== undefined) {
              cursors.moveCursor(id, {
                index,
                length,
              });
            }
            break;
          }
          case 'removeUserCursor': {
            const { id } = mutation.payload;
            cursors.removeCursor(id);
            break;
          }
          case 'updateUserCursor': {
            const { id, index, length } = mutation.payload;
            cursors.moveCursor(id, {
              index,
              length,
            });
            break;
          }
        }
      });
    }
  },
  watch: {
    note(newNote, oldNote) {
      if (oldNote) {
        oldNote.content.getText('text').unobserve(this.textObserver);
      }
      if (newNote) {
        newNote.content.getText('text').observe(this.textObserver);
      }
    },
  },
  beforeDestroy() {
    this.quill.off('text-change', this.quillTextChange);
    delete this.quill;
    this.quill = null;
    this.note.content.getText('text').unobserve(this.textObserver);
  },
};
</script>
