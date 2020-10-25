<template>
  <div class="content container">
    <h4>Changing {{user.fullName}}'s password</h4>
    <form @submit.prevent="savePassword">
      <div class="form-group row">
        <label for="newPassword" class="col-2 col-form-label">New password</label>
        <div class="col">
          <input
            type="password"
            class="form-control"
            v-model="newPassword"
            id="newPassword"
            :class="{ 'is-invalid': formErrors.has('newPassword') }"
          />
          <span
            v-for="error in formErrors.getErrors('newPassword')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="newPasswordConfirm" class="col-2 col-form-label">New password confirm</label>
        <div class="col">
          <input
            type="password"
            class="form-control"
            v-model="newPasswordConfirm"
            id="newPasswordConfirm"
            :class="{ 'is-invalid': formErrors.has('newPasswordConfirm') }"
          />
          <span
            v-for="error in formErrors.getErrors('newPasswordConfirm')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group">
        <button class="btn btn-primary mr-2">Save changes</button>
        <router-link :to="`/users/form/${this.id}`" class="btn btn-secondary">Cancel</router-link>
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
      newPassword: '',
      newPasswordConfirm: '',
      formErrors: new ValidationErrors(),
      user: {},
    };
  },
  mounted() {
    this.id = this.$route.params.id || '';
    if (this.id) {
      this.$store.commit('setGlobalIsLoading', true);
      Axios.get(`/user/${this.id}`)
        .then((resp) => {
          this.user = resp.data;
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
    savePassword() {
      Axios.patch(`/user/${this.id}/changePassword`, {
        newPassword: this.newPassword,
        newPasswordConfirm: this.newPasswordConfirm,
      })
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
