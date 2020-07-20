<template>
  <div class="note-explorer">
    <div class="col-12 pb-2">
      <div class="row no-gutters">
        <div class="col-12 text-right">
          <button type="button" class="btn btn-sm" @click="showCreateNote = true">
            <i class="fas fa-plus"></i>
          </button>
          <button type="button" class="btn btn-sm ml-2" @click="closeExplorer">
            <i class="fas fa-chevron-left"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="note-explorer-content">
      <div class="col-12" v-if="isLoading">Loading . . .</div>
      <div
        class="col-12"
        v-else-if="notes.length === 0"
      >No notes, you can create one by click "+" button</div>
      <note-explorer-item v-for="note in notes" :key="`note-${note._id}`" :note="note" />
    </div>

    <utility-bar />

    <b-modal v-if="showCreateNote" :visible="true" @hidden="handleCloseCreateNote">
      <template v-slot:modal-title>Create a new note</template>
      <template v-slot:default>
        <form @submit.prevent="handleCreateNote">
          <div class="form-group">
            <label>Title</label>
            <input
              type="text"
              class="form-control"
              v-model="newNoteTitle"
              :class="{ 'is-invalid': newNoteErrors.has('newNoteTitle') }"
              placeholder="Title"
            />
            <p
              v-if="newNoteErrors.has('newNoteTitle')"
              class="invalid-feedback"
            >{{newNoteErrors.getFirst('newNoteTitle')}}</p>
            <div v-if="isCreatingNote">Loading . . .</div>
          </div>
        </form>
      </template>
      <template v-slot:modal-footer>
        <button class="btn btn-secondary" @click="handleCloseCreateNote">Close</button>
        <button class="btn btn-primary" @click="handleCreateNote">Create</button>
      </template>
    </b-modal>

    <b-modal v-if="toDeleteNote._id" :visible="true" @hidden="handleCloseDelete">
      <template v-slot:modal-title>Delete "{{toDeleteNote.title}}"</template>
      <template v-slot:default>Are you sure you want to delete?</template>
      <template v-slot:modal-footer>
        <button class="btn btn-secondary" @click="handleCloseDelete">Close</button>
        <button class="btn btn-danger" @click="handleDeleteNote">Delete</button>
      </template>
    </b-modal>
  </div>
</template>

<script>
import NoteExplorerItem from './NoteExplorerItem';
import UtilityBar from './UtilityBar';
import { mapGetters } from 'vuex';
import * as Y from 'yjs';
import ValidationErrors from '../helpers/validationErrors';

export default {
  components: {
    NoteExplorerItem,
    UtilityBar,
  },
  data() {
    return {
      showCreateNote: false,
      newNoteTitle: '',
      newNoteErrors: new ValidationErrors(),
    };
  },
  computed: {
    notes() {
      return this.$store.getters.allNotes;
    },
    ...mapGetters([
      'isLoading',
      'isCreatingNote',
      'toDeleteNote',
    ]),
  },
  methods: {
    handleCreateNote() {
      if (this.newNoteTitle.trim() === '') {
        this.newNoteErrors.addError('newNoteTitle', 'Note title cannot be empty');
        return;
      }
      const self = this;
      this.$store.dispatch('createNote', {
        title: this.newNoteTitle,
        content: new Y.Doc(),
        contentType: '',
      })
        .then(() => {
          self.handleCloseCreateNote();
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
    handleCloseCreateNote() {
      this.showCreateNote = false;
      this.newNoteTitle = '';
      this.newNoteErrors.reset();
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
  },
};
</script>
