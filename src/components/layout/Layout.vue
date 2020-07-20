<template>
  <div>
    <nav class="navbar navbar-light">
      <a class="navbar-brand" href="#">
        <img src="../../images/BeeJee-logo-small.png" alt="BeeJee" width="30" height="30" />
        BeeJee
      </a>
      <ul class="navbar-nav ml-auto">
        <b-nav-item-dropdown right>
          <template v-slot:button-content>
            <em>{{user.fullName}}</em>
          </template>
          <b-dropdown-item href="#" @click.prevent="logout">Logout</b-dropdown-item>
        </b-nav-item-dropdown>
      </ul>
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
      <pane :size="contentSize">
        <router-view :key="$route.fullPath" />
      </pane>
    </splitpanes>
  </div>
</template>

<script>
import NoteExplorer from '../NoteExplorer';
import { Splitpanes, Pane } from 'splitpanes';
import { mapGetters } from 'vuex';

export default {
  components: {
    NoteExplorer,
    Splitpanes,
    Pane,
  },
  data() {
    return {
      showUserMenu: false,
    };
  },
  computed: {
    explorerSize() {
      let explorerSize = this.$store.getters.config('explorerSize');
      if (explorerSize > 30) {
        explorerSize = 30;
      }
      return explorerSize;
    },
    contentSize() {
      if (this.explorerClosed) {
        return 100;
      }
      return 100 - this.explorerSize;
    },
    explorerClosed() {
      return this.$store.getters.config('explorerClosed');
    },
    ...mapGetters([
      'user',
    ]),
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
      if (!size) {
        size = explorerPane.size;
      }
      if (this.explorerClosed) {
        explorerPane.$el.style['margin-left'] = `-${size}%`;
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
    logout() {
      const self = this;
      this.$store.dispatch('logout')
        .then(() => {
          self.$router.push('/login');
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
