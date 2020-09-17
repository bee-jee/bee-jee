<template>
  <div class="position-relative">
    <router-link
      :to="getNoteUrl(note)"
      class="note-explorer-item py-1 px-3"
      :class="{active: selectedNote._id === note._id}"
      :title="note.title"
    >
      <div
        class="note-item-title position-relative mr-1"
        :class="{'font-weight-bold': selectedNote._id === note._id}"
      >{{note.title ? note.title : 'No title'}}</div>
    </router-link>
    <div class="note-explorer-item-actions">
      <span v-if="sharedNote.isViewed==false" class="badge badge-warning">New</span>
      <button
        class="btn-icon btn-danger"
        @click="handleClickDeleteNote(note)"
        v-if="note.author === user._id"
      >
        <i class="far fa-trash-alt fa-sm"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    note: { type: Object },
    urlBuilder: { type: Function, default: undefined },
  },
  computed: {
    ...mapGetters([
      'selectedNote',
      'user',
    ]),
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
};
</script>
