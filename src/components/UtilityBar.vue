<template>
  <div class="col-12 utility-bar py-2">
    <div class="row">
      <div class="col-auto">
        <small class="text-success" v-if="websocketIsConnected && isLoggedIn">
          <b>Connected</b>
        </small>
        <small class="text-danger" v-else>
          <b>{{disconnectedStatus}}</b>
        </small>
      </div>
      <div class="col-auto">
        <div
          v-if="isSyncing"
          class="spinner spinner-grow spinner-grow-sm text-primary"
          role="status"
        >
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters([
      'isSyncing',
      'websocketIsConnected',
      'isLoggedIn',
    ]),
    disconnectedStatus() {
      if (!this.websocketIsConnected) {
        return 'Disconnected';
      }
      return 'Not logged in';
    },
  },
}
</script>
