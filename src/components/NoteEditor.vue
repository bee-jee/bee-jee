<template>
  <div class="note-editor">
    <div class="text-center" id="toolbar" :class="{ 'd-none': !!!note._id }" ref="toolbar">
      <div class="d-inline-block text-left">
        <span class="ql-formats">
          <span class="ql-picker" @click="handleShowEditTitle">
            <span class="ql-picker-label" role="button">Edit title</span>
          </span>
        </span>
        <span class="ql-formats">
          <select class="ql-size"></select>
        </span>
        <span class="ql-formats">
          <button class="ql-bold"></button>
          <button class="ql-italic"></button>
          <button class="ql-underline"></button>
          <button class="ql-strike"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-blockquote"></button>
          <button class="ql-code-block"></button>
        </span>
        <span class="ql-formats">
          <select class="ql-header"></select>
        </span>
        <span class="ql-formats">
          <button class="ql-list" value="ordered"></button>
          <button class="ql-list" value="bullet"></button>
          <button class="ql-indent" value="-1"></button>
          <button class="ql-indent" value="+1"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-script" value="sub"></button>
          <button class="ql-script" value="super"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-direction" value="rtl"></button>
          <select class="ql-align"></select>
        </span>
        <span class="ql-formats">
          <select class="ql-color"></select>
          <select class="ql-background"></select>
        </span>
        <span class="ql-formats">
          <button class="ql-link"></button>
          <button class="ql-image"></button>
          <button class="ql-video"></button>
          <button class="ql-formula"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-clean"></button>
        </span>
      </div>
    </div>
    <div v-if="note && note._id" class="note-editor-container" ref="editorContainer">
      <editor :note="note"></editor>
    </div>

    <modal name="editTitle" height="auto" :draggable="true" :adaptive="true">
      <form @submit.prevent="handleEditTitle" class="p-2">
        <h5>Edit title</h5>
        <div class="form-group">
          <input type="text" class="form-control" v-model="editedTitle" />
          <div v-if="isUpdatingNoteTitle">Loading . . .</div>
        </div>
        <div class="text-right">
          <button type="button" class="btn btn-secondary mr-2" @click="handleCloseEditTitle">Cancel</button>
          <button class="btn btn-primary" @click="handleEditTitle">Save</button>
        </div>
      </form>
    </modal>
  </div>
</template>

<script>
import Editor from './Editor';
import { ResizeSensor } from 'css-element-queries';
import { mapGetters } from 'vuex';

function getElementHeight(el) {
  let height, margin;
  if (document.all) { // IE
    height = el.currentStyle.height;
    margin = parseInt(el.currentStyle.marginTop, 10) + parseInt(el.currentStyle.marginBottom, 10);
  } else { // Mozilla
    height = parseFloat(document.defaultView.getComputedStyle(el, '').height);
    margin = parseInt(document.defaultView.getComputedStyle(el, '').getPropertyValue('margin-top')) +
      parseInt(document.defaultView.getComputedStyle(el, '').getPropertyValue('margin-bottom'));
  }
  return height + margin;
}

export default {
  components: {
    Editor,
  },
  data() {
    return {
      editedTitle: '',
    };
  },
  computed: {
    ...mapGetters([
      'isUpdatingNoteTitle',
    ]),
    note() {
      return this.$store.getters.selectedNote;
    },
  },
  created() {
    if (this.$route.params.id) {
      this.$store.dispatch('setSelectedNote', {
        _id: this.$route.params.id,
      });
    }
  },
  methods: {
    calculateContainerSize() {
      const toolbarHeight = getElementHeight(this.$refs.toolbar) + 1;
      const container = this.$refs.editorContainer;
      container.style.height = `calc(100% - ${toolbarHeight}px)`;
    },
    handleShowEditTitle() {
      this.$modal.show('editTitle');
      this.editedTitle = this.note.title;
    },
    handleCloseEditTitle() {
      this.$modal.hide('editTitle');
    },
    handleEditTitle() {
      this.handleCloseEditTitle();
      this.$store.dispatch('editNoteTitle', {
        _id: this.note._id,
        title: this.editedTitle,
      });
    },
  },
  mounted() {
    // this.calculateContainerSize();
    // ResizeSensor.detach(this.$refs.toolbar);
    new ResizeSensor(this.$refs.toolbar, () => {
      this.calculateContainerSize();
    });
  },
  watch: {
    note(newNote, oldNote) {
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
  },
}
</script>
