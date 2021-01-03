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

    <modal name="share" height="auto" :adaptive="true">
      <form @submit.prevent="handleChangeShare">
        <share-selector
          class="form-group"
          :errors="editShareErrors"
          v-model="permission"
          :note="note"
          @cancel="handleCloseEditShare"
        />
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
    handleShowEditShare() {
      this.$modal.show('share');
    },
    handleCloseEditShare() {
      this.$modal.hide('share');
      this.populatePermission(this.note);
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
        guestAccess: note.guestAccess,
      };
    },
  },
  mounted() {
    if (this.note) {
      this.populatePermission(this.note);
    }
  },
  watch: {
    note(newNote) {
      this.populatePermission(newNote);
    },
    $route(to) {
      if (to.params.id) {
        this.setSelectedNote(to.params.id);
      } else {
        this.$store.commit('setSelectedNote', {});
      }
    },
  },
};
</script>
