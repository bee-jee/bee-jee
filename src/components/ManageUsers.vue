<template>
  <div class="content container py-2">
    <h4>Manage users</h4>
    <div class="mb-3">
      <router-link class="btn btn-primary" to="/users/form">Create user</router-link>
    </div>
    <pagination
      :currentPage="manageUserCurrentPage"
      :pages="userPages"
      :pageUrl="(page) => `/users/${page}`"
      class="mb-0"
    />
    <div class="row font-weight-bold no-gutters">
      <div class="col-4 border-bottom p-2">Username</div>
      <div class="col-4 border-bottom p-2">Full name</div>
      <div class="col-2 border-bottom p-2">Role</div>
      <div class="col-2 border-bottom p-2">Actions</div>
    </div>
    <div v-if="!usersIsLoading">
      <div v-for="user in allUsers" :key="user._id" class="row no-gutters">
        <div class="col-4 border-top p-2">{{user.username}}</div>
        <div class="col-4 border-top p-2">{{user.fullName}}</div>
        <div class="col-2 border-top p-2">{{user.role}}</div>
        <div class="col-2 border-top p-2">
          <router-link :to="`/users/form/${user._id}`" class="btn btn-secondary mr-1">
            <i class="far fa-edit fa-sm"></i>
          </router-link>
          <button
            v-if="loggedInUser._id !== user._id"
            class="btn btn-danger"
            @click="handleDelete(user._id)"
            @blur="toDeleteId = ''"
          >
            <div class="float-left">
              <i class="far fa-trash-alt fa-sm"></i>
            </div>
            <transition name="slide-right">
              <div class="float-left" v-if="toDeleteId === user._id">
                <span class="pl-1">Delete</span>
              </div>
            </transition>
          </button>
        </div>
      </div>
    </div>
    <div v-if="usersIsLoading" class="row no-gutters">
      <div class="col p-2">Loading . . .</div>
    </div>
  </div>
</template>

<script>
import Axios from 'axios';
import { mapGetters } from 'vuex';
import Pagination from './utilities/Pagination';

export default {
  components: {
    Pagination,
  },
  computed: {
    ...mapGetters([
      'allUsers',
      'userPages',
      'manageUserCurrentPage',
      'usersIsLoading',
    ]),
    loggedInUser() {
      return this.$store.getters.user;
    },
  },
  data() {
    return {
      toDeleteId: '',
    };
  },
  methods: {
    handleDelete(id) {
      if (this.toDeleteId === id) {
        Axios.delete(`/user/${id}`)
          .then(() => {
            this.$store.dispatch('fetchUsers', this.manageUserCurrentPage);
          })
          .catch((err) => {
            console.error(err);
          });
        this.toDeleteId = '';
        return;
      }
      this.toDeleteId = id;
    },
  },
  mounted() {
    this.$store.dispatch('fetchUsers', this.$route.params.page || 1);
  },
  watch: {
    $route(to) {
      this.$store.dispatch('fetchUsers', to.params.page || 1);
    },
  },
};
</script>
