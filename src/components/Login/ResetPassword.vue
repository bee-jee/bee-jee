<template>
  <div class="content container">
    <form @submit.prevent="resetPassword">
      <div class="form-group row">
        <label for="new-password" class="col-2 col-form-label">New password</label>
        <div class="col">
          <input
            type="password"
            id="new-password"
            name="new-password"
            class="form-control"
            v-model="form.newPassword"
          />
        </div>
      </div>
      <div class="form-group row">
        <label for="new-password-confirm" class="col-2 col-form-label">Confirm new password</label>
        <div class="col">
          <input
            type="password"
            id="new-password-confirm"
            name="new-password-confirm"
            class="form-control"
            v-model="form.newPasswordConfirm"
          />
        </div>
      </div>
      <div class="form-group row">
        <div class="offset-2 col">
          <p v-if="form.message" class="text-success">{{ form.message }}</p>
          <button class="btn btn-primary mr-2" :disabled="form.isLoading">
            <span class="spinner-border spinner-border-sm text-success" role="status" v-if="form.isLoading">
              <span class="sr-only">Loading...</span>
            </span>
            <template v-else>Submit</template>
          </button>
          <router-link to="/login" class="btn btn-secondary">Go to login</router-link>
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
      secret: '',
      form: {
        newPassword: '',
        newPasswordConfirm: '',
        message: '',
        isLoading: false,
      },
      formErrors: new ValidationErrors(),
    };
  },
  mounted() {
    this.secret = this.$route.params.secret;
  },
  methods: {
    async resetPassword() {
      Vue.set(this.form, 'isLoading', false);
      try {
        const resp = await axios.post(`/user/resetPassword/${this.secret}`, this.form);
        if (resp.data.status === 'ok') {
          Vue.set(this.form, 'message', resp.data.message);
        }
      } catch (err) {
        this.formErrors.populateFromPayload(err.response.data);
      } finally {
        Vue.set(this.form, 'isLoading', false);
      }
    },
  },
};
</script>
