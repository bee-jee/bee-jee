<template>
  <div class="container">
    <div v-if="this.successMessage" class="text-success">
      <p>{{ successMessage }}</p>
    </div>
    <div v-else-if="this.errorMessage" class="text-danger">
      <p>{{ errorMessage }}</p>
    </div>
    <div>
      <router-link to="/login" class="btn btn-primary">Back to login</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  mounted() {
    let { username, secret } = this.$route.params;

    username = decodeURIComponent(username);
    this.confirmEmail(username, secret);
  },
  data() {
    return {
      successMessage: '',
      errorMessage: '',
    };
  },
  methods: {
    async confirmEmail(username, secret) {
      this.$store.commit('setGlobalIsLoading', true);
      try {
        const resp = await axios.post('/user/confirmEmail', { username, secret });
        if (resp.data.status === 'ok') {
          this.successMessage = resp.data.message;
        } else {
          this.errorMessage = 'Server returns invalid response, please contact web administrators.';
        }
      } catch (err) {
        if (err.response) {
          this.errorMessage = err.response.data.message;
        } else {
          this.errorMessage = 'Internal server error.';
        }
      } finally {
        this.$store.commit('setGlobalIsLoading', false);
      }
    },
  },
};
</script>
