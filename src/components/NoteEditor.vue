<template>
  <div class="note-editor">
    <div id="toolbar" class="text-center" v-if="note._id" ref="toolbar">
      <span class="ql-formats">
        <select class="ql-size"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-bold"></button>
        <button class="ql-italic"></button>
        <button class="ql-underline"></button>
        <button class="ql-strike"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-blockquote"></button>
        <button class="ql-code-block"></button>
      </span>
      <span class="ql-formats">
        <select class="ql-header"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered"></button>
        <button class="ql-list" value="bullet"></button>
        <button class="ql-indent" value="-1"></button>
        <button class="ql-indent" value="+1"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-script" value="sub"></button>
        <button class="ql-script" value="super"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-direction" value="rtl"></button>
        <select class="ql-align"></select>
      </span>
      <span class="ql-formats">
        <select class="ql-color"></select>
        <select class="ql-background"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-link"></button>
        <button class="ql-image"></button>
        <button class="ql-video"></button>
        <button class="ql-formula"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-clean"></button>
      </span>
    </div>
    <div v-if="note && note._id" class="note-editor-container" ref="editorContainer">
      <editor :note="note"></editor>
    </div>
  </div>
</template>

<script>
import Editor from './Editor';
import { ResizeSensor } from 'css-element-queries';

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

export default {
  components: {
    Editor,
  },
  data() {
    return {
      editorOptions: {
        usageStatistics: false,
      },
    };
  },
  computed: {
    note() {
      return this.$store.getters.selectedNote;
    },
  },
  created() {
    if (this.$route.params.id) {
      this.$store.dispatch('setSelectedNote', {
        _id: this.$route.params.id,
      });
    }
  },
  methods: {
    calculateContainerSize() {
      const toolbarHeight = getElementHeight(this.$refs.toolbar);
      const container = this.$refs.editorContainer;
      container.style.height = `calc(100% - ${toolbarHeight}px)`;
    },
  },
  updated() {
    this.calculateContainerSize();
    ResizeSensor.detach(this.$refs.toolbar);
    new ResizeSensor(this.$refs.toolbar, () => {
      this.calculateContainerSize();
    });
  },
}
</script>
