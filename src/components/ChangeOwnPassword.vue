<template>
  <div class="content container py-2">
    <h4>Change own password</h4>
    <form @submit.prevent="changePassword">
      <div v-if="successMessage" class="alert alert-success">{{successMessage}}</div>
      <div class="form-group row">
        <label for="currentPassword" class="col-sm-3 col-12">Current password</label>
        <div class="col-sm-9 col-12">
          <input
            type="password"
            class="form-control"
            v-model="currentPassword"
            :class="{ 'is-invalid': formErrors.has('currentPassword') }"
            placeholder="Current password"
            id="currentPassword"
            autocomplete="off"
          />
          <span
            v-for="error in formErrors.getErrors('currentPassword')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="newPassword" class="col-sm-3 col-12">New password</label>
        <div class="col-sm-9 col-12">
          <input
            type="password"
            class="form-control"
            v-model="newPassword"
            :class="{ 'is-invalid': formErrors.has('newPassword') }"
            placeholder="New password"
            id="newPassword"
            autocomplete="off"
          />
          <span
            v-for="error in formErrors.getErrors('newPassword')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <label for="newPasswordConfirm" class="col-sm-3 col-12">Confirm new password</label>
        <div class="col-sm-9 col-12">
          <input
            type="password"
            class="form-control"
            v-model="newPasswordConfirm"
            :class="{ 'is-invalid': formErrors.has('newPasswordConfirm') }"
            placeholder="Confirm new password"
            id="newPasswordConfirm"
            autocomplete="off"
          />
          <span
            v-for="error in formErrors.getErrors('newPasswordConfirm')"
            :key="error"
            class="invalid-feedback"
          >{{error}}</span>
        </div>
      </div>
      <div class="form-group row">
        <div class="col-12">
          <button class="btn btn-primary">Save</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import ValidationErrors from '../helpers/validationErrors';

export default {
  data() {
    return {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
      formErrors: new ValidationErrors(),
      successMessage: '',
    };
  },
  methods: {
    changePassword() {
      this.formErrors.reset();
      this.$http.post('/user/changeOwnPassword', {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        newPasswordConfirm: this.newPasswordConfirm,
      })
        .then((resp) => {
          if (resp.data.status === 'ok') {
            this.successMessage = 'Your password has been changed successfully';
          }
        })
        .catch((err) => {
          if (err.response && err.response.status === 400) {
            this.formErrors.setErrors(err.response.data.errors);
          }
        });
    },
  },
}
</script>
