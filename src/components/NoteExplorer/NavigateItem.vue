<template>
  <div>
    <router-link
      :to="getNoteUrl(note)"
      class="py-1 px-3 navigate-item note-explorer-item"
      :class="{ active: isSelected }"
      :title="note.title"
    >
      <highlightable-text
        :text="note.title ? note.title : 'No title'"
        :should-highlight="!!note.title"
        :indexes="note.navigateIndexes || []"
      />
    </router-link>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import HighlightableText from '../layout/HighlightableText.vue';

export default {
  components: { HighlightableText },
  props: {
    note: Object,
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters(['selectedNote']),
  },
  methods: {
    getNoteUrl(note) {
      return `/${note._id}`;
    },
  },
};
</script>
