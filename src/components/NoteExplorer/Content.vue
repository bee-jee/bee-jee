<template>
  <div class="note-explorer-content pane-wrapper">
    <collapsible-pane
      title="My notes"
      :expanded="myNotesExpanded"
      @setExpanded="(value) => { setExpanded('myNotesExpanded', value) }"
      ref="myNotes"
    >
      <div v-if="isLoading" class="px-3">Loading . . .</div>
      <div
        v-else-if="allMyNotesTree.length === 0"
        class="px-3"
      >No notes, you can create one by click "+" button</div>
      <note-explorer-item
        v-for="note in allMyNotesTree"
        :id="`my-note-${note._id}`"
        :key="`note-${note._id}`"
        :note="note"
      />

      <template v-slot:actions>
        <div class="actions text-right">
          <button type="button" class="btn btn-icon btn-grow" @click.stop="handleShowCreateNote">
            <i class="fas fa-plus fa-xs"></i>
          </button>
        </div>
      </template>
    </collapsible-pane>

    <collapsible-pane
      title="Shared notes"
      :expanded="sharedNotesExpanded"
      @setExpanded="(value) => setExpanded('sharedNotesExpanded', value)"
    >
      <div v-if="isLoadingSharedNotes" class="px-3">Loading . . .</div>
      <div v-if="allSharedNotes.length === 0" class="px-3">You don't have any shared notes</div>
      <note-explorer-item
        v-for="note in allSharedNotes"
        :key="`shared-note-${note._id}`"
        :note="note"
        :urlBuilder="(note) => `/view-shared/${note._id}`"
      />

      <template v-slot:actions>
        <span v-if="numOfUnviewed > 0" class="badge badge-warning ml-1">{{numOfUnviewed}}</span>
      </template>
    </collapsible-pane>

    <modal
      name="createNote"
      height="auto"
      draggable=".modal-mover"
      :adaptive="true"
      @closed="handleCloseCreateNote"
    >
      <div class="p-3">
        <h5>
          <i class="fas fa-arrows-alt modal-mover"></i> Create a new note
        </h5>
        <form @submit.prevent="handleCreateNote">
          <div class="form-group">
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
          </div>
          <share-selector
            class="form-group"
            :errors="newNoteErrors"
            v-model="permission"
            :note="{}"
          />
          <div v-if="isCreatingNote">Loading . . .</div>
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
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CollapsiblePane from './CollapsiblePane';
import NoteExplorerItem from './Item';
import ShareSelector from '../Note/ShareSelector';
import ValidationErrors from '../../helpers/validationErrors';

export default {
  components: {
    CollapsiblePane,
    NoteExplorerItem,
    ShareSelector,
  },
  data() {
    return {
      container: null,
      indexedPanes: {},
      newNoteTitle: '',
      newNoteErrors: new ValidationErrors(),
      permission: {},
      initMyNotesScroll: true,
    };
  },
  computed: {
    numOfUnviewed() {
      // return 3;
      // console.log(this.$store.getters.numOfAllUnviewedNotes);
      return this.$store.getters.numOfAllUnviewedNotes;
    },
    sharedNotes() {
      // console.log(this.$store.getters.allSharedNotes);
      return this.$store.getters.allSharedNotes;
    },
    myNotesExpanded: {
      get() {
        return this.$store.getters.config('myNotesExpanded');
      },
      set(value) {
        this.$store.dispatch('setConfig', {
          key: 'myNotesExpanded',
          value,
        });
      },
    },
    sharedNotesExpanded: {
      get() {
        return this.$store.getters.config('sharedNotesExpanded');
      },
      set(value) {
        this.$store.dispatch('setConfig', {
          key: 'sharedNotesExpanded',
          value,
        });
      },
    },
    ...mapGetters([
      'isLoading',
      'isCreatingNote',
      'isLoadingSharedNotes',
      'allMyNotes',
      'allSharedNotes',
      'selectedNote',
      'showCreateNoteModal',
      'newNoteParent',
      'allMyNotesTree',
    ]),
  },
  methods: {
    handleCloseCreateNote() {
      this.$modal.hide('createNote');
      this.newNoteTitle = '';
      this.permission = {};
      this.newNoteErrors.reset();
      this.$store.commit('setNewNoteParent', {});
      this.$store.commit('setShowCreateNoteModal', false);
    },
    handleCreateNote() {
      this.newNoteErrors.reset();
      if (this.newNoteTitle.trim() === '') {
        this.newNoteErrors.addError('newNoteTitle', 'Note title cannot be empty');
        return;
      }
      const self = this;
      this.$store
        .dispatch('createNote', {
          title: this.newNoteTitle,
          permission: this.permission,
          parentNoteId: this.newNoteParent._id,
        })
        .then(() => {
          self.handleCloseCreateNote();
        })
        .catch((err) => {
          if (err && err.response) {
            this.newNoteErrors.setErrors(err.response.data.errors);
          }
        });
    },
    setExpanded(name, value) {
      this[name] = value;
    },
    handleShowCreateNote() {
      this.$store.commit('setShowCreateNoteModal', true);
    },
  },
  mounted() {
    this.$store.dispatch('fetchNumOfUnviewedSharedNutes');
  },
  updated() {
    if (this.initMyNotesScroll) {
      const selectedNoteEl = document.getElementById(`my-note-${this.selectedNote._id}`);
      if (selectedNoteEl) {
        this.$refs.myNotes.scroll((scrollView) => {
          scrollView.scrollTop = selectedNoteEl.offsetTop
            - (scrollView.offsetHeight / 2)
            + (selectedNoteEl.offsetHeight / 2);
        });
        this.initMyNotesScroll = false;
      }
    }
  },
  watch: {
    showCreateNoteModal(show) {
      if (show) {
        this.$modal.show('createNote');
      }
    },
  },
};
</script>
