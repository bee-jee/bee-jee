<template>
  <div class="text-center login-container">
    <form class="form-login" @submit.prevent="login">
      <img class="mb-4" src="../images/BeeJee-logo-small.png" alt="BeeJee" width="72" height="72" />
      <h1 class="h3 mb-3 font-weight-normal">Please sign in</h1>
      <div class="mb-4">
        <label for="inputUsername" class="sr-only">Username</label>
        <input
          type="text"
          id="inputUsername"
          class="form-control username"
          placeholder="Username"
          v-model="username"
          required
          autofocus
        />
        <label for="inputPassword" class="sr-only">Password</label>
        <input
          type="password"
          id="inputPassword"
          class="form-control"
          v-model="password"
          placeholder="Password"
          required
        />
        <div class="text-danger" v-if="loginError">{{loginError}}</div>
      </div>
      <button class="btn btn-lg btn-primary btn-block" type="submit">
        <span class="spinner-border text-success" role="status" v-if="isLoggingIn">
          <span class="sr-only">Loading...</span>
        </span>
        <template v-else>Sign in</template>
      </button>
    </form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  data() {
    return {
      username: '',
      password: '',
    };
  },
  methods: {
    login() {
      if (this.isLoggingIn) {
        return;
      }
      const { username, password } = this;
      const self = this;
      this.$store.dispatch('login', { username, password })
        .then(function () {
          if (self.isLoggedIn) {
            return self.$store.dispatch('popWantsUrl');
          }
          return Promise.resolve(null);
        })
        .then((wantsUrl) => {
          if (!wantsUrl) {
            wantsUrl = '/login';
          }
          if (self.isLoggedIn) {
            self.$router.push(wantsUrl);
          }
        });
    },
  },
  computed: {
    ...mapGetters([
      'loginError',
      'isLoggedIn',
      'isLoggingIn',
    ]),
  },
}
</script>

<style>
html,
body,
#app,
.login-container {
  height: 100%;
}

.login-container {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
  -ms-flex-align: center;
  -ms-flex-pack: center;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
  background-color: #f5f5f5;
}

.form-login {
  width: 100%;
  max-width: 330px;
  padding: 15px;
}

.form-login input.username {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}

.form-login input[type='password'] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.form-login .form-control {
  position: relative;
  box-sizing: border-box;
  height: auto;
  padding: 10px;
  font-size: 16px;
}

.form-login .form-control:focus {
  z-index: 2;
}
</style>
