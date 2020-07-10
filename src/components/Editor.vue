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
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image', 'video'],
    ],
  },
  readOnly: false,
};

function getElementHeight(el) {
  let height, margin;
  if (document.all) { // IE
    height = el.currentStyle.height;
    margin = parseInt(el.currentStyle.marginTop, 10) + parseInt(el.currentStyle.marginBottom, 10);
  } else { // Mozilla
    height = parseFloat(document.defaultView.getComputedStyle(el, '').height);
    margin = parseInt(document.defaultView.getComputedStyle(el, '').getPropertyValue('margin-top')) +
      parseInt(document.defaultView.getComputedStyle(el, '').getPropertyValue('margin-bottom'));
  }
  return height + margin;
}

function calculateQlContainerSize() {
  const toolbarHeight = getElementHeight(document.getElementsByClassName('ql-toolbar')[0]);
  console.log(toolbarHeight);
  const qlContainer = document.getElementsByClassName('ql-container')[0];
  qlContainer.style.height = `calc(100% - ${toolbarHeight}px)`;
}

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
      ops.forEach(op => {
        if (op.attributes !== undefined) {
          for (let key in op.attributes) {
            if (this.negatedUsedFormats[key] === undefined) {
              this.negatedUsedFormats[key] = false
            }
          }
        }
      });
      this.$store.dispatch('changeNoteContent', {
        _id: this.note._id,
        ops,
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
      negatedUsedFormats: {},
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

      calculateQlContainerSize();
      window.addEventListener('resize', () => {
        calculateQlContainerSize();
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
