<template>
  <div id="app">
    <router-view></router-view>

    <modal name="expiredSession" height="auto" :adaptive="true" @closed="handleCloseExpired">
      <div class="p-3">
        <h5>Your session has expired</h5>
        <p>Your session has expired, do you want to redirect to the login page? If you don't want to your edit will not be able be saved.</p>
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
  created() {
    this.$http.interceptors.response.use(undefined, function (err) {
      if (err.status === 401) {
        this.$router.push('/login');
      }
      throw err;
    });
    const self = this;
    this.$router.beforeEach((to, from, next) => {
      self.showExpired = to.matched.some(record => record.meta.requiresAuth) && !self.isLoggedIn;
      next();
    });
  },
  computed: {
    ...mapGetters([
      'isLoggedIn',
    ]),
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
      this.$router.push('/login');
    },
    invalidateModal() {
      if (this.showExpired) {
        this.$modal.show('expiredSession');
      } else {
        this.$modal.hide('expiredSession');
      }
    },
  },
  watch: {
    isLoggedIn(newValue) {
      if (!newValue) {
        this.showExpired = true;
      }
    },
    showExpired() {
      this.invalidateModal();
    },
  },
}
</script>
