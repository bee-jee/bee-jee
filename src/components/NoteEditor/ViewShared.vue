<template>
  <div class="note-editor">
    <div
      v-if="note && note._id"
      class="note-editor-container position-relative"
      ref="editorContainer"
    >
      <tiptap-editor :note="note" :key="note._id" :readOnly="isReadOnly" :isOwner="false"></tiptap-editor>
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
import TiptapEditor from './TiptapEditor';

export default {
  components: {
    TiptapEditor,
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
    async setSelectedNote(id) {
      await this.$store.dispatch('setSelectedSharedNote', {
        _id: id,
      });
      await this.$store.dispatch('fetchNumOfUnviewedSharedNutes');
    },
  },
  created() {
    if (this.$route.params.id) {
      this.setSelectedNote(this.$route.params.id);
    }
  },
  watch: {
    $route(to) {
      if (to.params.id) {
        this.setSelectedNote(to.params.id);
      }
    },
  },
};
</script>
