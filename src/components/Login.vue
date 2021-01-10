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
        <div class="text-danger" v-if="loginError">
          {{ loginError }}
          <div v-if="loginErrorResponse.errorCode === 'user_is_not_confirmed'">
            <a href="#" @click.prevent="resendConfirmationEmail(loginErrorResponse.params)">
              <span
                class="spinner-border spinner-border-sm text-success"
                role="status"
                v-if="isResendingConfirmationEmail"
              >
                <span class="sr-only">Loading...</span>
              </span>
              <template v-else>Re-send confirmation email</template>
            </a>
            <div v-if="resendError">Error: {{ resendError }}</div>
            <div v-if="resendSuccessMessage" class="alert alert-success">{{ resendSuccessMessage }}</div>
          </div>
        </div>
      </div>
      <button class="btn btn-lg btn-primary btn-block" type="submit">
        <span class="spinner-border text-success" role="status" v-if="isLoggingIn">
          <span class="sr-only">Loading...</span>
        </span>
        <template v-else>Sign in</template>
      </button>
      <div>
        Don't have an account?
      </div>
      <div>
        <router-link to="/login/register">Register a new account now.</router-link>
      </div>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';
export default {
  mounted() {
    this.$store.commit('setLoginError', '');
  },
  data() {
    return {
      username: '',
      password: '',
      isResendingConfirmationEmail: false,
      resendError: '',
      resendSuccessMessage: '',
    };
  },
  methods: {
    login() {
      if (this.isLoggingIn) {
        return;
      }
      const { username, password } = this;
      const self = this;
      this.$store
        .dispatch('login', { vm: this, username, password })
        .then(function () {
          if (self.isLoggedIn) {
            return self.$store.dispatch('popWantsUrl');
          }
          return Promise.resolve(null);
        })
        .then((wantsUrl) => {
          if (!wantsUrl) {
            wantsUrl = '/';
          }
          if (self.isLoggedIn) {
            self.$router.push(wantsUrl);
          }
        });
    },
    async resendConfirmationEmail({ _id }) {
      this.isResendingConfirmationEmail = true;
      this.resendError = '';
      this.resendSuccessMessage = '';
      try {
        const resp = await axios.post(`/user/resendConfirmationEmail/${_id}`);
        if (resp.data.status === 'ok') {
          this.resendSuccessMessage = resp.data.message;
        } else {
          this.resendError = 'Unknown server error';
        }
      } catch (err) {
        if (err.response && err.response.data.message) {
          this.resendError = err.response.data.message;
          return;
        }
        this.resendError = 'Unknown server error';
      } finally {
        this.isResendingConfirmationEmail = false;
      }
    },
  },
  computed: {
    ...mapGetters(['loginError', 'loginErrorResponse', 'isLoggedIn', 'isLoggingIn']),
  },
};
</script>

<style>
html,
body,
#app {
  height: 100%;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
  height: auto;
  min-height: 100%;
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
