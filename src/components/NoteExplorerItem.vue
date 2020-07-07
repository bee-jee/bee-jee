<template>
  <div>
      <router-link
        :to="`/${note._id}`"
        class="list-group-item list-group-item-action"
        :class="{active: selectedNoteId === note._id}"
        @click="handleClickNoteItem(note)"
      >
        <div class="row no-gutters">
          <div class="col-10">
            <b>{{note.title ? note.title : 'No title'}}</b>
          </div>
          <div class="col-2 text-right">
            <i
              class="far fa-trash-alt btn-icon btn-danger"
              @click="handleClickDeleteNote(note)"
            ></i>
          </div>
        </div>
        <p
          class="note-item-summary"
          :class="{ 'text-muted': selectedNoteId !== note._id }"
          v-html="getNoteContent(note) ? getNoteContent(note) : 'No content'"
        >
        </p>
      </router-link>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import noteMixins from '../helpers/noteMixins';

export default {
  props: ['note'],
  mixins: [
    noteMixins,
  ],
  computed: {
    ...mapGetters([
      'selectedNoteId',
    ]),
  },
  methods: {
    handleClickNoteItem(note) {
      this.$store.dispatch('setSelectedNote', note);
    },
    handleClickDeleteNote(note) {
      this.$store.dispatch('setToDeleteNote', note);
    },
  },
}
</script>
