<template>
  <div class="note-editor">
    <div
      v-if="!isReadOnly"
      class="text-center"
      id="toolbar"
      :class="{ 'd-none': !!!note._id }"
      ref="toolbar"
      :key="note._id"
    >
      <div class="d-inline-block text-left">
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
          <button class="ql-code-block" title="Code block"></button>
          <button class="ql-code" title="Inline code"></button>
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
    </div>
    <div
      v-if="note && note._id"
      class="note-editor-container position-relative"
      ref="editorContainer"
    >
      <editor :note="note" :key="note._id" :readOnly="isReadOnly"></editor>
      <transition name="fade">
        <div class="loading-spinner-overlay" v-if="isLoadingSelectedNote"></div>
      </transition>
      <transition name="fade">
        <div class="loading-spinner" v-if="isLoadingSelectedNote">
          <div class="spinner-border text-success" role="status">
            <span class="sr-only">Loading...</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ResizeSensor } from 'css-element-queries';
import Editor from './Editor';
import { getElementHeight } from '../../helpers/dom';

export default {
  components: {
    Editor,
  },
  computed: {
    ...mapGetters(['isLoadingSelectedNote']),
    note() {
      return this.$store.getters.selectedNote;
    },
    sharedNote() {
      return this.$store.getters.sharedById(this.note._id);
    },
    isReadOnly() {
      if (!this.sharedNote.permission) {
        return true;
      }
      return this.sharedNote.permission !== 'write';
    },
  },
  methods: {
    setSelectedNote(id) {
      this.$store.dispatch('setSelectedSharedNote', {
        _id: id,
      });
    },
    calculateContainerSize() {
      const container = this.$refs.editorContainer;
      if (!container) {
        return;
      }
      if (this.isReadOnly) {
        container.style.height = '100%';
        return;
      }
      const toolbarHeight = getElementHeight(this.$refs.toolbar) + 1;
      container.style.height = `calc(100% - ${toolbarHeight}px)`;
    },
  },
  created() {
    if (this.$route.params.id) {
      this.setSelectedNote(this.$route.params.id);
    }
  },
  mounted() {
    if (this.$refs.toolbar) {
      new ResizeSensor(this.$refs.toolbar, () => {
        this.calculateContainerSize();
      });
    }
  },
  updated() {
    this.calculateContainerSize();
  },
  watch: {
    note(newNote, oldNote) {
      if (newNote._id === oldNote._id) {
        return;
      }
      if (oldNote._id) {
        this.$store.dispatch('leaveNote', {
          _id: oldNote._id,
        });
      }
      if (newNote._id) {
        this.$store.dispatch('enterNote', {
          _id: newNote._id,
        });
      }
    },
    $route(to) {
      if (to.params.id) {
        this.setSelectedNote(to.params.id);
        this.$store.dispatch('fetchNumOfUnviewedSharedNutes');
      }
    },
  },
};
</script>
