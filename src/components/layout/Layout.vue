<template>
  <div>
    <nav class="navbar navbar-light">
      <a class="navbar-brand" href="#">BeeJee</a>
    </nav>
    <splitpanes @resize="resize" class="content">
      <pane min-size="15" :size="explorerSize" max-size="30" class="explorer" ref="explorer">
        <note-explorer />
        <button
          v-if="explorerClosed"
          type="button"
          class="btn open-explorer"
          @click="openExplorer"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </pane>
      <pane size="100" ref="mainContent">
        <router-view :key="$route.fullPath" />
      </pane>
    </splitpanes>
  </div>
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
    explorerClosed() {
      return this.$store.getters.config('explorerClosed');
    },
  },
  methods: {
    resize(panes) {
      this.$store.dispatch('setConfig', {
        key: 'explorerSize',
        value: panes[0].size,
      });
      this.updateExplorerMargin(panes[0].size);
    },
    updateExplorerMargin(size) {
      const explorerPane = this.$refs.explorer;
      const mainContentPane = this.$refs.mainContent;
      if (!size) {
        size = explorerPane.size;
      }
      if (this.explorerClosed) {
        explorerPane.$el.style['margin-left'] = `-${size}%`;
        mainContentPane.$el.style['width'] = '100%';
      } else {
        explorerPane.$el.style['margin-left'] = '0';
      }
    },
    openExplorer() {
      this.$store.dispatch('setConfig', {
        key: 'explorerClosed',
        value: false,
      });
    },
  },
  mounted() {
    this.$store.dispatch('retrieveConfig');
    this.updateExplorerMargin();
  },
  watch: {
    explorerClosed() {
      this.updateExplorerMargin();
    },
    explorerSize() {
      this.updateExplorerMargin(this.explorerSize);
    },
  },
}
</script>
