<template>
  <div class="note-editor">
    <div
      v-if="note && note._id"
      class="note-editor-container position-relative"
      ref="editorContainer"
    >
      <tiptap-editor :note="note" :key="note._id"></tiptap-editor>
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

    <modal name="editTitle" height="auto" draggable=".modal-mover" :adaptive="true">
      <form @submit.prevent="handleEditTitle" class="p-3">
        <h5>
          <i class="fas fa-arrows-alt modal-mover"></i> Edit title
        </h5>
        <div class="form-group">
          <input
            type="text"
            class="form-control"
            v-model="editedTitle"
            :class="{ 'is-invalid': editTitleErrors.has('title') }"
          />
          <div v-if="isUpdatingNote">Loading . . .</div>
          <span
            class="invalid-feedback"
            v-for="error in editTitleErrors.getErrors('title')"
            :key="error"
          >{{error}}</span>
        </div>
        <div class="text-right">
          <button type="button" class="btn btn-secondary mr-2" @click="handleCloseEditTitle">Cancel</button>
          <button class="btn btn-primary" @click="handleEditTitle">Save</button>
        </div>
      </form>
    </modal>

    <modal name="share" height="auto" :adaptive="true">
      <form @submit.prevent="handleChangeShare" class="p-3">
        <share-selector class="form-group" :errors="editShareErrors" v-model="permission" />
        <div class="text-right">
          <button type="button" class="btn btn-secondary mr-2" @click="handleCloseEditShare">Cancel</button>
          <button class="btn btn-primary">Save changes</button>
        </div>
      </form>
    </modal>
  </div>
</template>

<script>
import TiptapEditor from './NoteEditor/TiptapEditor';
import { mapGetters } from 'vuex';
import ValidationErrors from '../helpers/validationErrors';
import ShareSelector from './Note/ShareSelector';

export default {
  components: {
    TiptapEditor,
    ShareSelector,
  },
  data() {
    return {
      editedTitle: '',
      editTitleErrors: new ValidationErrors(),
      permission: {},
      editShareErrors: new ValidationErrors(),
    };
  },
  computed: {
    ...mapGetters(['isUpdatingNote', 'isLoadingSelectedNote']),
    note() {
      return this.$store.getters.selectedNote;
    },
  },
  created() {
    if (this.$route.params.id) {
      this.setSelectedNote(this.$route.params.id);
    }
  },
  methods: {
    handleShowEditTitle() {
      this.$modal.show('editTitle');
      this.editedTitle = this.note.title;
      this.editTitleErrors.reset();
    },
    handleShowEditShare() {
      this.$modal.show('share');
    },
    handleCloseEditShare() {
      this.$modal.hide('share');
    },
    handleCloseEditTitle() {
      this.$modal.hide('editTitle');
    },
    handleEditTitle() {
      this.$store
        .dispatch('editNoteTitle', {
          _id: this.note._id,
          title: this.editedTitle,
        })
        .then(() => {
          this.handleCloseEditTitle();
        })
        .catch((err) => {
          this.editTitleErrors.setErrors(err.response.data.errors);
        });
    },
    handleChangeShare() {
      const { permission } = this;
      this.$store
        .dispatch('editNoteShare', {
          _id: this.note._id,
          permission,
        })
        .then(() => {
          this.handleCloseEditShare();
        })
        .catch((err) => {
          this.editShareErrors.setErrors(err.response.data.errors);
        });
    },
    setSelectedNote(id) {
      this.$store.dispatch('setSelectedNote', {
        _id: id,
      });
    },
    populatePermission(note) {
      this.permission = {
        visibility: note.visibility,
        sharedUsers: (note.sharedUsers || []).map((sharedUser) => ({
          username: sharedUser.user ? sharedUser.user.username : '',
          permission: sharedUser.permission,
        })),
      };
    },
  },
  mounted() {
    if (this.note) {
      this.populatePermission(this.note);
    }
  },
  watch: {
    note(newNote, oldNote) {
      this.populatePermission(newNote);
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
      }
    },
  },
};
</script>
