<template>
  <splitpanes
    @resize="resize"
  >
    <pane min-size="15" :size="explorerSize" max-size="30">
      <note-explorer />
    </pane>
    <pane :size="otherPaneSize">
      <router-view :key="$route.fullPath" />
    </pane>
  </splitpanes>
</template>

<script>
import NoteExplorer from '../NoteExplorer';
import { Splitpanes, Pane } from 'splitpanes';

export default {
  components: {
    NoteExplorer,
    Splitpanes,
    Pane,
  },
  computed: {
    explorerSize() {
      let explorerSize = this.$store.getters.config('explorerSize');
      if (explorerSize > 30) {
        explorerSize = 30;
      }
      return explorerSize;
    },
    otherPaneSize() {
      return 100 - this.explorerSize;
    },
  },
  methods: {
    resize(panes) {
      this.$store.dispatch('setConfig', {
        key: 'explorerSize',
        value: panes[0].size,
      });
    },
  },
  mounted() {
    this.$store.dispatch('retrieveConfig');
  },
}
</script>
