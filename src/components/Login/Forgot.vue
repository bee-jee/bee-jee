<template>
  <div class="content container">
    <p>
      Please enter your email address or your username, an email with instructions to recover your password will be sent
      to your email address if it exists in our database
    </p>
    <form @submit.prevent="requestForgotPassword">
      <div class="form-group row">
        <label for="email" class="col-2 col-form-label">Email</label>
        <div class="col">
          <input
            type="text"
            class="form-control"
            v-model="form.email"
            id="email"
            :class="{ 'is-invalid': formErrors.has('email') }"
          />
          <span v-for="error in formErrors.getErrors('email')" :key="error" class="invalid-feedback">{{ error }}</span>
        </div>
      </div>
      <div class="form-group">
        Or
      </div>
      <div class="form-group row">
        <label for="username" class="col-2 col-form-label">Username</label>
        <div class="col">
          <input
            type="text"
            class="form-control"
            v-model="form.username"
            id="username"
            :class="{ 'is-invalid': formErrors.has('username') }"
          />
          <span v-for="error in formErrors.getErrors('username')" :key="error" class="invalid-feedback">{{
            error
          }}</span>
        </div>
      </div>
      <div class="form-group row">
        <div class="offset-2 col">
          <p v-if="form.message" class="text-success">{{form.message}}</p>
          <p v-if="formErrors.formError" class="text-danger">{{formErrors.formError}}</p>
          <button class="btn btn-primary mr-2" :disabled="form.isLoading">
            <span class="spinner-border spinner-border-sm text-success" role="status" v-if="form.isLoading">
              <span class="sr-only">Loading...</span>
            </span>
            <template v-else>Submit</template>
          </button>
          <router-link to="/login" class="btn btn-secondary">Cancel</router-link>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
import ValidationErrors from '../../helpers/validationErrors';
import Vue from 'vue';

export default {
  data() {
    return {
      form: {
        username: '',
        email: '',
        isLoading: false,
        message: '',
      },
      formErrors: new ValidationErrors(),
    };
  },
  methods: {
    async requestForgotPassword() {
      Vue.set(this.form, 'isLoading', true);
      Vue.set(this.form, 'message', '');
      this.formErrors.reset();
      try {
        const resp = await axios.post('/auth/forgotPassword', {
          ...this.form,
        });

        if (resp.data.status === 'ok') {
          Vue.set(this.form, 'message', resp.data.message);
        }
      } catch (err) {
        if (err.response.data) {
          this.formErrors.populateFromPayload(err.response.data);
        } else {
          this.formErrors.setFormError('Unknown error, please try again later');
        }
      } finally {
        Vue.set(this.form, 'isLoading', false);
      }
    },
  },
};
</script>
