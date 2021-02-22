<template>
  <div class="container">
    <tiptap-editor
      v-if="note && note._id"
      :note="note"
      :key="note._id"
      :isGuest="true"
      :readOnly="true"
      :isOwner="false"
    />
  </div>
</template>

<script>
import TiptapEditor from './NoteEditor/TiptapEditor';

export default {
  components: {
    TiptapEditor,
  },
  computed: {
    note() {
      return this.$store.getters.selectedNote;
    },
  },
  watch: {
    $route: {
      immediate: true,
      handler(to) {
        if (to.params.id) {
          this.$store.dispatch('fetchPublicAccessNote', {
            _id: to.params.id,
          });
        } else {
          this.$store.dispatch('closeSelectedNote');
        }
      },
    },
  },
};
</script>
