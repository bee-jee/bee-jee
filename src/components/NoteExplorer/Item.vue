<template>
  <div class="position-relative">
    <router-link
      :to="getNoteUrl(note)"
      class="note-explorer-item py-1 px-3"
      :class="{active: selectedNote._id === note._id}"
      :title="note.title"
    >
      <div class="note-item-title position-relative mr-1">
        <b>{{note.title ? note.title : 'No title'}}</b>
        <span v-if="sharedNote.isViewed==false" class="badge badge-warning">New</span>
      </div>
      <p
        class="note-item-summary text-muted"
        :key="noteContentKey"
        v-html="noteContent"
      ></p>
    </router-link>
    <div class="note-explorer-item-delete">
      <button class="btn-icon btn-danger" @click="handleClickDeleteNote(note)">
        <i class="far fa-trash-alt fa-sm"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import noteMixins from '../../helpers/noteMixins';

export default {
  props: {
    note: { type: Object, },
    urlBuilder: { type: Function, default: undefined },
  },
  mixins: [
    noteMixins,
  ],
  computed: {
    ...mapGetters([
      'selectedNote',
    ]),
    noteContentKey() {
      if (this.note._id === this.selectedNote._id) {
        return `${this.note._id}-${this.selectedNote.contentVersion}`;
      }
      return this.note._id;
    },
    noteContent() {
      const note = this.note._id === this.selectedNote._id
        ? this.selectedNote : this.note;
      return this.getNoteContent(note) || 'No content';
    },
    sharedNote() {
      return this.$store.getters.sharedById(this.note._id);
    },
  },
  methods: {
    handleClickDeleteNote(note) {
      this.$store.dispatch('setToDeleteNote', note);
    },
    getNoteUrl(note) {
      if (this.urlBuilder !== undefined) {
        return this.urlBuilder(note);
      }
      return `/${note._id}`;
    },
  },
}
</script>
