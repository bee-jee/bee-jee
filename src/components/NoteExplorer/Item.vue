<template>
  <div class="position-relative">
    <router-link
      :to="getNoteUrl(note)"
      class="note-explorer-item p-1 row no-gutters pr-3"
      :class="{ active: selectedNote._id === note._id }"
      :title="note.title"
    >
      <div class="col-auto">
        <div class="note-item-expand" @click.prevent="toggleShowChildren">
          <span class="expander" :class="{ collapsed: !showChildren }">
            <mt-icon :path="mdiMenuDown"></mt-icon>
          </span>
        </div>
      </div>
      <div class="col">
        <div
          class="note-item-title position-relative mr-1"
          :class="{'font-weight-bold': selectedNote._id === note._id}"
        >
          {{note.title ? note.title : 'No title'}}
        </div>
        <span class="text-muted" v-if="showChildren && children.length === 0">No pages inside</span>
      </div>
      <div class="col-auto">
        <span v-if="sharedNote.isViewed==false" class="badge badge-warning">New</span>
        <button
          class="btn-icon btn-secondary"
          @click="handleShowCreateSubNote()"
          v-if="note.author === user._id"
        >
          <i class="fas fa-plus fa-xs"></i>
        </button>
        <button
          class="btn-icon btn-danger"
          @click="handleClickDeleteNote(note)"
          v-if="note.author === user._id"
        >
          <i class="far fa-trash-alt fa-sm"></i>
        </button>
      </div>
    </router-link>
    <template v-if="showChildren && children.length">
      <note-explorer-item
        v-for="note in children"
        :id="`my-note-${note._id}`"
        :key="`note-${note._id}`"
        :note="note"
        :urlBuilder="urlBuilder"
        class="ml-2"
      />
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import {
  mdiMenuDown,
} from '@mdi/js';

export default {
  name: 'note-explorer-item',
  props: {
    note: { type: Object },
    urlBuilder: { type: Function, default: undefined },
  },
  data() {
    return {
      showChildren: true,
      mdiMenuDown,
    };
  },
  computed: {
    ...mapGetters([
      'selectedNote',
      'user',
    ]),
    sharedNote() {
      return this.$store.getters.sharedById(this.note._id);
    },
    children() {
      return this.note.children || [];
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
    handleShowCreateSubNote() {
      this.$store.commit('setNewNoteParent', this.note);
      this.$store.commit('setShowCreateNoteModal', true);
    },
    toggleShowChildren() {
      this.showChildren = !this.showChildren;
    },
  },
  watch: {
    children: {
      immediate: true,
      handler(children) {
        if (children.length === 0) {
          this.showChildren = false;
        }
      },
    },
  },
};
</script>
