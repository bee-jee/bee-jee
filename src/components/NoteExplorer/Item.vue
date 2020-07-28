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
      </div>
      <p
        class="note-item-summary text-muted"
        v-html="getNoteContent(note) ? getNoteContent(note) : 'No content'"
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
