<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="dark" fixed="top">
      <router-link to="/" class="navbar-brand">
        <img src="../../images/BeeJee-logo-small.png" alt="BeeJee" width="30" height="30" />
        BeeJee
      </router-link>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav v-if="allowedNavigations.length">
          <li class="nav-item" v-for="navigation in allowedNavigations" :key="navigation.id">
            <router-link :to="navigation.href" v-slot="{ href, route, navigate, isActive }">
              <a
                :href="href"
                class="nav-link"
                :class="{ active: isActive }"
                @click="navigate"
              >{{navigation.label}}</a>
            </router-link>
          </li>
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown right>
            <template v-slot:button-content>
              <em>{{user.fullName}}</em>
            </template>
            <router-link
              to="/change-own-password"
              role="menuitem"
              class="dropdown-item"
            >Change password</router-link>
            <a role="menuitem" class="dropdown-item" href="#" @click.prevent="logout">Logout</a>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <router-view />
    <div class="fullpage-overlay align-middle" v-if="globalIsLoading">
      <div class="loading-spinner">
        <div class="spinner-grow text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <div class="spinner-grow text-secondary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <div class="spinner-grow text-success" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <div class="spinner-grow text-danger" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <div class="spinner-grow text-warning" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <div class="spinner-grow text-info" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import navigations from '../../helpers/nav';

export default {
  computed: {
    ...mapGetters(['user', 'globalIsLoading']),
    allowedNavigations() {
      return navigations.filter((navigation) => {
        return navigation.hasAccess(this.user);
      });
    },
  },
  methods: {
    logout() {
      const self = this;
      this.$store.dispatch('logout').then(() => {
        self.$router.push('/login');
      });
    },
  },
};
</script>
