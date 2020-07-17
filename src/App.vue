<template>
  <div id="app">
    <router-view></router-view>

    <b-modal :visible="requiresAuth && showExpired" centered @hidden="handleCloseExpired">
      <template v-slot:modal-title>Your session has expired</template>
      <template
        v-slot:default
      >Your session has expired do you want to redirect to the login page. If you don't want to your edit will not be able be saved.</template>
      <template v-slot:modal-footer>
        <button class="btn btn-danger" @click="handleCloseExpired">No</button>
        <button class="btn btn-primary" @click="handleRedirect">Yes</button>
      </template>
    </b-modal>
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
      self.requiresAuth = to.matched.some(record => record.meta.requiresAuth);
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
      requiresAuth: false,
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
  },
  watch: {
    isLoggedIn(newValue) {
      if (!newValue) {
        this.showExpired = true;
      }
    },
  },
}
</script>
