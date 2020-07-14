<template>
  <div ref="editor"></div>
</template>

<script>
import Quill from 'quill';
import QuillCursors from 'quill-cursors';

Quill.register('modules/cursors', QuillCursors);

const options = {
  theme: 'snow',
  modules: {
    cursors: true,
    toolbar: '#toolbar',
  },
  readOnly: false,
};

export default {
  props: [
    'note',
  ],
  methods: {
    quillTextChange(delta, oldContents, source) {
      if (source === 'yjs') {
        return;
      }
      // update content
      const ops = delta.ops
      this.$store.dispatch('changeNoteContent', {
        _id: this.note._id,
        ops,
      });
    },
    quillSelectionChange(range) {
      if (range === null) {
        return;
      }
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
  data() {
    return {
      internalNote: {},
    };
  },
  mounted() {
    if (this.$refs.editor) {
      this.quill = new Quill(this.$refs.editor, options);
      this.quillCursors = this.quill.getModule('cursors') || null;
      if (this.note !== undefined) {
        this.quill.setContents(this.note.content.getText('text').toDelta());
      }
      this.internalNote = this.note;
      this.internalNote.content.getText('text').observe(this.textObserver);
      this.quill.on('text-change', this.quillTextChange);
      this.quill.on('selection-change', this.quillSelectionChange);

      const cursors = this.quillCursors;
      this.$store.subscribe((mutation) => {
        switch (mutation.type) {
          case 'appendUserCursor': {
            const { id, name, color } = mutation.payload;
            cursors.createCursor(id, name, color);
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
              index, length,
            });
            break;
          }
        }
      });
    }
  },
  beforeDestroy() {
    this.quill.off('text-change', this.quillTextChange);
    delete this.quill;
    this.quill = null;
    this.internalNote.content.getText('text').unobserve(this.textObserver);
  },
}
</script>
