<template>
  <div class="content container">
    <div class="alert alert-success" v-if="isSubmitted">
      Your registration is almost complete, an email is sent to your email address, please confirm before you can log
      in.
    </div>
    <div class="alert alert-danger" v-if="formErrors.formError">
      {{formErrors.formError}}
    </div>
    <h4>Register</h4>
    <form @submit.prevent="registerUser">
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
        <label for="password" class="col-2 col-form-label">Password</label>
        <div class="col">
          <input
            type="password"
            class="form-control"
            v-model="form.password"
            id="password"
            :class="{ 'is-invalid': formErrors.has('password') }"
          />
          <span v-for="error in formErrors.getErrors('password')" :key="error" class="invalid-feedback">{{
            error
          }}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="passwordConfirm" class="col-2 col-form-label">Confirm password</label>
        <div class="col">
          <input
            type="password"
            class="form-control"
            v-model="form.passwordConfirm"
            id="passwordConfirm"
            :class="{ 'is-invalid': formErrors.has('passwordConfirm') }"
          />
          <span v-for="error in formErrors.getErrors('passwordConfirm')" :key="error" class="invalid-feedback">{{
            error
          }}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="email" class="col-2 col-form-label">Email</label>
        <div class="col">
          <input
            type="email"
            class="form-control"
            v-model="form.email"
            id="email"
            :class="{ 'is-invalid': formErrors.has('email') }"
          />
          <span v-for="error in formErrors.getErrors('email')" :key="error" class="invalid-feedback">{{ error }}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="firstName" class="col-2 col-form-label">First name</label>
        <div class="col">
          <input
            type="text"
            class="form-control"
            v-model="form.firstName"
            id="firstName"
            :class="{ 'is-invalid': formErrors.has('firstName') }"
          />
          <span v-for="error in formErrors.getErrors('firstName')" :key="error" class="invalid-feedback">{{
            error
          }}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="lastName" class="col-2 col-form-label">Last name</label>
        <div class="col">
          <input
            type="text"
            class="form-control"
            v-model="form.lastName"
            id="lastName"
            :class="{ 'is-invalid': formErrors.has('lastName') }"
          />
          <span v-for="error in formErrors.getErrors('lastName')" :key="error" class="invalid-feedback">{{
            error
          }}</span>
        </div>
      </div>
      <div class="form-group row">
        <div class="offset-2 col">
          <button class="btn btn-primary mr-2" :disabled="isLoading">
            <span class="spinner-border spinner-border-sm text-success" role="status" v-if="isLoading">
              <span class="sr-only">Loading...</span>
            </span>
            <template v-else>Save changes</template>
          </button>
          <router-link to="/login" class="btn btn-secondary">Cancel</router-link>
        </div>
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
      form: {
        username: '',
        password: '',
        passwordConfirm: '',
        email: '',
        firstName: '',
        lastName: '',
      },
      isLoading: false,
      isSubmitted: false,
      formErrors: new ValidationErrors(),
    };
  },
  methods: {
    async registerUser() {
      this.isLoading = true;
      this.isSubmitted = false;
      this.formErrors.reset();
      try {
        await Axios.post('/user/register', {
          ...this.form,
        });
        this.isSubmitted = true;
      } catch (err) {
        if (err.response) {
          this.formErrors.setErrors(err.response.data.errors);
        } else {
          this.formErrors.setFormError('Unknown error, please try again later');
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>
