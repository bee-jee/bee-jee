<template>
  <div class="text-center login-container">
    <form class="form-login" @submit.prevent="login">
      <img class="mb-4" src="../images/BeeJee-logo-small.png" alt="BeeJee" width="72" height="72" />
      <h1 class="h3 mb-3 font-weight-normal">Please sign in</h1>
      <p class="text-danger" v-if="error">{{error}}</p>
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
      </div>
      <button class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      error: null,
    };
  },
  methods: {
    login() {
      const { username, password } = this;
      const self = this;
      this.$store.dispatch('login', { username, password })
        .then(function () {
          self.$router.push('/');
        })
        .catch((err) => {
          self.error = err;
        });
    },
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
  margin: 0 auto;
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
