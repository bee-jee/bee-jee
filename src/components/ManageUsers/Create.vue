<template>
  <div class="content container">
    <h4>{{title}}</h4>
    <form @submit.prevent="saveUser">
      <div class="form-group row">
        <label for="username" class="col-2 col-form-label">Username</label>
        <div class="col">
          <input
            type="text"
            class="form-control"
            v-model="username"
            id="username"
            :class="{ 'is-invalid': formErrors.has('username') }"
            v-if="!id"
          />
          <span v-else>{{username}}</span>
          <span
            v-for="error in formErrors.getErrors('username')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="password" class="col-2 col-form-label">Password</label>
        <div class="col">
          <input
            type="password"
            class="form-control"
            v-model="password"
            id="password"
            v-if="!id"
            :class="{ 'is-invalid': formErrors.has('password') }"
          />
          <router-link
            v-else
            class="btn btn-secondary"
            :to="`/users/form/${id}/change-password`"
          >Change password</router-link>
          <span
            v-for="error in formErrors.getErrors('password')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row" v-if="!id">
        <label for="passwordConfirm" class="col-2 col-form-label">Confirm password</label>
        <div class="col">
          <input
            type="password"
            class="form-control"
            v-model="passwordConfirm"
            id="passwordConfirm"
            :class="{ 'is-invalid': formErrors.has('passwordConfirm') }"
          />
          <span
            v-for="error in formErrors.getErrors('passwordConfirm')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="firstName" class="col-2 col-form-label">First name</label>
        <div class="col">
          <input
            type="text"
            class="form-control"
            v-model="firstName"
            id="firstName"
            :class="{ 'is-invalid': formErrors.has('firstName') }"
          />
          <span
            v-for="error in formErrors.getErrors('firstName')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="lastName" class="col-2 col-form-label">Last name</label>
        <div class="col">
          <input
            type="text"
            class="form-control"
            v-model="lastName"
            id="lastName"
            :class="{ 'is-invalid': formErrors.has('lastName') }"
          />
          <span
            v-for="error in formErrors.getErrors('lastName')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="role" class="col-2 col-form-label">Role</label>
        <div class="col">
          <select
            id="role"
            v-model="role"
            class="form-control"
            :class="{ 'is-invalid': formErrors.has('role') }"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <span
            v-for="error in formErrors.getErrors('role')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group">
        <button class="btn btn-primary mr-2">Save changes</button>
        <router-link to="/users/" class="btn btn-secondary">Cancel</router-link>
      </div>
    </form>
  </div>
</template>

<script>
import Axios from 'axios';
import ValidationErrors from '../../helpers/validationErrors';
export default {
  data() {
    return {
      id: '',
      username: '',
      password: '',
      passwordConfirm: '',
      firstName: '',
      lastName: '',
      role: 'user',
      formErrors: new ValidationErrors(),
    };
  },
  computed: {
    title() {
      if (this.id) {
        return 'Edit user';
      }
      return 'Create user';
    },
  },
  mounted() {
    this.id = this.$route.params.id || '';
    if (this.id) {
      this.$store.commit('setGlobalIsLoading', true);
      Axios.get(`/user/${this.id}`)
        .then((resp) => {
          const { username, firstName, lastName, role } = resp.data;
          this.username = username;
          this.firstName = firstName;
          this.lastName = lastName;
          this.role = role;
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.$store.commit('setGlobalIsLoading', false);
        });
    }
  },
  methods: {
    saveUser() {
      let promise = null;
      this.formErrors.reset();
      if (!this.id) {
        promise = Axios.post('/user/', {
          username: this.username,
          password: this.password,
          passwordConfirm: this.passwordConfirm,
          firstName: this.firstName,
          lastName: this.lastName,
          role: this.role,
        });
      } else {
        promise = Axios.patch(`/user/${this.id}`, {
          firstName: this.firstName,
          lastName: this.lastName,
          role: this.role,
        });
      }
      promise
        .then(() => {
          this.$router.push('/users/');
        })
        .catch((err) => {
          this.formErrors.setErrors(err.response.data.errors);
        });
    },
  },
};
</script>
