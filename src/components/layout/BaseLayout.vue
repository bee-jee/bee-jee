<template>
  <div>
    <nav class="navbar navbar-light">
      <router-link to="/" class="navbar-brand">
        <img src="../../images/BeeJee-logo-small.png" alt="BeeJee" width="30" height="30" />
        BeeJee
      </router-link>
      <ul class="navbar-nav ml-auto">
        <b-nav-item-dropdown right>
          <template v-slot:button-content>
            <em>{{user.fullName}}</em>
          </template>
          <router-link to="/change-own-password" v-slot="{ href, navigate }">
            <b-dropdown-item :href="href" @click="navigate">Change password</b-dropdown-item>
          </router-link>
          <b-dropdown-item href="#" @click.prevent="logout">Logout</b-dropdown-item>
        </b-nav-item-dropdown>
      </ul>
    </nav>
    <router-view />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters([
      'user',
    ]),
  },
  methods: {
    logout() {
      const self = this;
      this.$store.dispatch('logout')
        .then(() => {
          self.$router.push('/login');
        });
    },
  },
}
</script>
