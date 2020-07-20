<template>
  <div class="note-explorer">
    <div class="col-12 p-0">
      <div class="row no-gutters">
        <div class="col-12 text-right">
          <button type="button" class="btn px-2" @click="$modal.show('createNote')">
            <i class="fas fa-plus"></i>
          </button>
          <button type="button" class="btn px-2 ml-2" @click="closeExplorer">
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

    <modal
      name="createNote"
      height="auto"
      :draggable="true"
      :adaptive="true"
      @closed="handleCloseCreateNote"
    >
      <div class="p-3">
        <h5>Create a new note</h5>
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
          <div class="text-right">
            <button
              type="button"
              class="btn btn-secondary mr-2"
              @click="handleCloseCreateNote"
            >Cancel</button>
            <button class="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </modal>

    <modal
      name="deleteNote"
      height="auto"
      :draggable="true"
      :adaptive="true"
      @closed="handleCloseDelete"
    >
      <div class="p-3">
        <h5>Delete "{{toDeleteNote.title}}"</h5>
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
      this.newNoteErrors.reset();
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
      this.$modal.hide('createNote');
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
  watch: {
    toDeleteNote(note) {
      if (note._id) {
        this.$modal.show('deleteNote');
      } else {
        this.$modal.hide('deleteNote');
      }
    }
  },
};
</script>
