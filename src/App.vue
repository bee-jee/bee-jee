<template>
  <div id="app">
    <router-view></router-view>

    <modal name="expiredSession" height="auto" :adaptive="true" @closed="handleCloseExpired">
      <div class="p-3">
        <h5>Your session has expired</h5>
        <p>
          Your session has expired, do you want to redirect to the login page?
        </p>
        <div class="text-right">
          <button class="btn btn-danger mr-2" @click="handleCloseExpired">No</button>
          <button class="btn btn-primary" @click="handleRedirect">Yes</button>
        </div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  mounted() {
    this.$store.dispatch('retrieveConfig');
    this.$store.dispatch('retrieveUser');
  },
  computed: {
    ...mapGetters(['isLoggedIn', 'logoutSource', 'isFinishedRefreshingAuth']),
  },
  data() {
    return {
      showExpired: false,
    };
  },
  methods: {
    handleCloseExpired() {
      this.showExpired = false;
    },
    handleRedirect() {
      this.handleCloseExpired();
      this.$store.commit('setWantsUrl', this.$route.fullPath);
      this.$router.push('/login');
    },
    invalidateModal() {
      if (this.showExpired) {
        this.$nextTick(() => {
          this.$modal.show('expiredSession');
        });
      } else {
        this.$modal.hide('expiredSession');
      }
    },
    checkIfLoginRequired() {
      if (!this.isFinishedRefreshingAuth) {
        return;
      }
      const routeRequiresAuth = this.$route.matched.some((route) => route.meta.requiresAuth);
      if (!this.isLoggedIn && routeRequiresAuth) {
        if (this.logoutSource === 'API') {
          this.showExpired = true;
        } else {
          this.$router.push('/login');
        }
      }
    },
  },
  watch: {
    isLoggedIn() {
      this.checkIfLoginRequired();
    },
    showExpired() {
      this.invalidateModal();
    },
    isFinishedRefreshingAuth() {
      this.checkIfLoginRequired();
    },
  },
};
</script>
