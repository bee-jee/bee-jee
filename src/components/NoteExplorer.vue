<template>
  <div class="note-explorer">
    <div class="p-0">
      <div class="col-12 text-right">
        <button type="button" class="btn px-2" @click="closeExplorer">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
    </div>
    <note-explorer-content />

    <utility-bar />

    <modal
      name="deleteNote"
      height="auto"
      draggable=".modal-mover"
      :adaptive="true"
      @closed="handleCloseDelete"
    >
      <div class="p-3">
        <h5>
          <i class="fas fa-arrows-alt modal-mover"></i>
          Delete "{{toDeleteNote.title}}"
        </h5>
        <p>Are you sure you want to delete?</p>
        <div class="text-right">
          <button class="btn btn-secondary mr-2" @click="handleCloseDelete">Close</button>
          <button class="btn btn-danger" @click="handleDeleteNote">Delete</button>
        </div>
      </div>
    </modal>
  </div>
</template>

<script>
import UtilityBar from './UtilityBar';
import { mapGetters } from 'vuex';
import NoteExplorerContent from './NoteExplorer/Content';

export default {
  components: {
    UtilityBar,
    NoteExplorerContent,
  },
  computed: {
    ...mapGetters(['toDeleteNote']),
  },
  methods: {
    handleCloseDelete() {
      this.$store.dispatch('setToDeleteNote', { _id: '' });
    },
    handleDeleteNote() {
      const self = this;
      this.$store.dispatch('deleteNote', this.toDeleteNote).then(() => {
        self.$store.dispatch('setToDeleteNote', { _id: '' });
      });
    },
    closeExplorer() {
      this.$store.dispatch('setConfig', {
        key: 'explorerClosed',
        value: true,
      });
    },
  },
  mounted() {
    this.$store.dispatch('fetchNotes');
    this.$store.dispatch('fetchSharedNotes');
  },
  watch: {
    toDeleteNote(note) {
      if (note._id) {
        this.$modal.show('deleteNote');
      } else {
        this.$modal.hide('deleteNote');
      }
    },
  },
};
</script>
