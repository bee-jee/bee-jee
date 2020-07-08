<template>
  <div class="col-12 utility-bar py-2">
    <div class="row">
      <div class="col-auto">
        <router-link to="/settings" class="btn-icon btn-primary">
          <i class="fas fa-cog"></i>
        </router-link>
      </div>
      <div class="col-auto">
        <span class="text-success" v-if="websocketIsConnected">Connected</span>
        <span class="text-danger" v-else>Disconnected</span>
      </div>
      <div class="col-auto">
        <div v-if="isSyncing" class="spinner spinner-grow spinner-grow-sm text-primary" role="status">
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
    ]),
  },
}
</script>
