<template>
  <div class="note-editor container-fluid py-3">
    <div v-if="note && note._id" class="row note-editor-container">
      <div class="col-12 form-group">
        <input
          type="text"
          class="title"
          placeholder="Title"
          @input="handleTitleUpdate"
          :value="note.title"
        />
      </div>
      <div class="col-12 form-group note-content-editor-container">
        <editor :note="note"></editor>
      </div>
    </div>
  </div>
</template>

<script>
import Editor from './Editor';

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
  methods: {
    handleTitleUpdate(e) {
      this.$store.dispatch('changeNoteTitle', {
        _id: this.note._id,
        title: e.target.value,
      });
    },
  },
  created() {
    if (this.$route.params.id) {
      this.$store.dispatch('setSelectedNote', {
        _id: this.$route.params.id,
      });
    }
  },
}
</script>
