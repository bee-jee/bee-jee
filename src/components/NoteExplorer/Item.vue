<template>
  <div class="position-relative">
    <router-link
      :to="getNoteUrl(note)"
      class="note-explorer-item p-1 row no-gutters"
      :class="{ active: selectedNote._id === note._id }"
      :title="note.title"
      v-slot="{ href, navigate }"
    >
      <a :href="href" @mousedown.stop="navigateToNote($event, navigate)">
        <div class="col-auto">
          <div class="note-item-expand mr-1" @click.prevent="toggleShowChildren">
            <span class="expander" :class="{ collapsed: !showChildren }">
              <mt-icon :path="mdiChevronDown"></mt-icon>
            </span>
          </div>
        </div>
        <div class="col">
          <div
            class="note-item-title position-relative"
            :class="{ 'font-weight-bold': selectedNote._id === note._id }"
          >
            <highlightable-text
              :text="note.title ? note.title : 'No title'"
              :should-highlight="!!note.title"
              :indexes="note.indexes"
            />
          </div>
          <span :class="{ 'text-muted': selectedNote._id !== note._id }" v-if="showChildren && children.length === 0"
            >No pages inside</span
          >
        </div>
        <div class="col-auto">
          <span v-if="sharedNote.isViewed == false" class="badge badge-warning">New</span>
          <button
            class="btn-icon btn-secondary"
            @click.prevent="handleShowCreateSubNote()"
            v-if="note.author === user._id"
          >
            <i class="fas fa-plus fa-xs"></i>
          </button>
          <button
            class="btn-icon btn-danger"
            @click.prevent="handleClickDeleteNote(note)"
            v-if="note.author === user._id"
          >
            <i class="far fa-trash-alt fa-sm"></i>
          </button>
        </div>
      </a>
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
import { mdiChevronDown } from '@mdi/js';
import { closest } from '../../helpers/dom';
import HighlightableText from '../layout/HighlightableText.vue';

export default {
  name: 'note-explorer-item',
  props: {
    note: { type: Object },
    urlBuilder: { type: Function, default: undefined },
  },
  data() {
    return {
      showChildren: true,
      mdiChevronDown,
    };
  },
  components: {
    HighlightableText,
  },
  computed: {
    ...mapGetters(['selectedNote', 'user']),
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
    navigateToNote(e, navigate) {
      if (!closest(e.target, '.expander')) {
        navigate(e);
      }
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
