<template>
  <div class="note-explorer">
    <div class="col-12 py-3">
      <div class="row no-gutters">
        <div class="col-10">
          <h4>Notes</h4>
        </div>
        <div class="col-2 text-right">
          <button type="button" class="btn btn-sm btn-primary" @click="handleCreateNote">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="list-group note-eplorer-content">
      <div class="col-12" v-if="isLoading">Loading . . .</div>
      <div
        class="col-12"
        v-else-if="notes.length === 0"
      >No notes, you can create one by click "+" button</div>
      <note-explorer-item v-for="note in notes" :key="`note-${note._id}`" :note="note" />
    </div>

    <utility-bar />

    <b-modal v-if="toDeleteNote._id" :visible="true" @hidden="handleCloseDelete">
      <template v-slot:modal-title>Delete "{{toDeleteNote.title}}"</template>
      <template v-slot:default>
        Are you sure you want to delete?
      </template>
      <template v-slot:modal-footer>
        <b-button variant="secondary" @click="handleCloseDelete">Close</b-button>
        <b-button variant="danger" @click="handleDeleteNote">Delete</b-button>
      </template>
    </b-modal>
  </div>
</template>

<script>
import NoteExplorerItem from './NoteExplorerItem';
import UtilityBar from './UtilityBar';
import { mapGetters } from 'vuex';
import { toContentType } from '../helpers/api';
import Automerge from 'automerge';

export default {
  components: {
    NoteExplorerItem,
    UtilityBar,
  },
  computed: {
    notes() {
      return this.$store.getters.allNotes;
    },
    defaultContentType() {
      return toContentType(this.$store.getters.config('defaultEditorEditType'));
    },
    ...mapGetters([
      'isLoading',
      'toDeleteNote',
    ]),
  },
  methods: {
    handleCreateNote() {
      this.$store.dispatch('createNote', {
        title: '',
        content: Automerge.from({
          text: new Automerge.Text(''),
        }),
        contentType: this.defaultContentType,
      });
    },
    handleCloseDelete() {
      this.$store.dispatch('setToDeleteNote', { _id: '' });
    },
    handleDeleteNote() {
      const self = this;
      this.$store.dispatch('deleteNote', this.toDeleteNote)
        .then(() => {
          self.$store.dispatch('setToDeleteNote', { _id: '' });
        });
    },
  },
  mounted() {
    this.$store.dispatch('fetchNotes');
  },
};
</script>
