<template>
  <div class="note-explorer">
    <div class="row no-gutters">
      <div class="col">
        <b-dropdown
          :text="user.fullName"
          block
          variant="link"
          toggle-class="text-decoration-none text-left user-menu-toggle overflow-hidden"
        >
          <b-dropdown-item disabled>{{user.fullName}}</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <router-link
            v-for="navigation in allowedNavigations"
            :key="navigation.id"
            :to="navigation.href"
            v-slot="{ href, navigate, isActive }"
          >
            <b-dropdown-item :href="href" :active="isActive" @click="navigate">{{navigation.label}}</b-dropdown-item>
          </router-link>
          <router-link to="/change-own-password" v-slot="{ href, navigate, isActive }">
            <b-dropdown-item :href="href" :active="isActive" @click="navigate">Change password</b-dropdown-item>
          </router-link>
          <b-dropdown-item href="#" @click="logout">Logout</b-dropdown-item>
        </b-dropdown>
      </div>
      <div class="col-auto">
        <button type="button" class="btn px-2" @click="closeExplorer">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
    </div>
    <note-explorer-content />

    <utility-bar />

    <modal
      name="deleteNote"
      height="auto"
      draggable=".modal-mover"
      :adaptive="true"
      @closed="handleCloseDelete"
    >
      <div class="p-3">
        <h5>
          <i class="fas fa-arrows-alt modal-mover"></i>
          Delete "{{toDeleteNote.title}}"
        </h5>
        <p>Are you sure you want to delete?</p>
        <div class="text-right">
          <button class="btn btn-secondary mr-2" @click="handleCloseDelete">Close</button>
          <button class="btn btn-danger" @click="handleDeleteNote">Delete</button>
        </div>
      </div>
    </modal>
  </div>
</template>

<script>
import UtilityBar from './UtilityBar';
import { mapGetters } from 'vuex';
import NoteExplorerContent from './NoteExplorer/Content';
import navigations from '../helpers/nav';

export default {
  components: {
    UtilityBar,
    NoteExplorerContent,
  },
  computed: {
    ...mapGetters(['toDeleteNote', 'user']),
    allowedNavigations() {
      return navigations.filter((navigation) => {
        return navigation.hasAccess(this.user);
      });
    },
  },
  methods: {
    handleCloseDelete() {
      this.$store.dispatch('setToDeleteNote', { _id: '' });
    },
    handleDeleteNote() {
      const self = this;
      this.$store.dispatch('deleteNote', this.toDeleteNote).then(() => {
        self.$store.dispatch('setToDeleteNote', { _id: '' });
      });
    },
    closeExplorer() {
      this.$store.dispatch('setConfig', {
        key: 'explorerClosed',
        value: true,
      });
    },
    logout() {
      this.$store.dispatch('logout', 'user');
    },
  },
  mounted() {
    this.$store.commit('resetAllNotes');
    this.$store.dispatch('fetchNotes');
    this.$store.dispatch('fetchSharedNotes');
  },
  beforeDestroy() {
    this.$store.commit('setSelectedNote', {});
  },
  watch: {
    toDeleteNote(note) {
      if (note._id) {
        this.$modal.show('deleteNote');
      } else {
        this.$modal.hide('deleteNote');
      }
    },
  },
};
</script>
