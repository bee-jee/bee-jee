<template>
  <div class="tabs-container row no-gutters pl-4">
    <router-link :to="`/${note._id}`" v-for="note in noteTabs" :key="note._id" v-slot="{ navigate }">
      <div
        class="col-auto tab"
        :class="{ active: note._id === selectedNote._id }"
        @click="navigate"
        @mouseup.middle="closeTab(note)"
      >
        {{ note.title }}
        <span title="Close" @click.prevent="closeTab(note)" class="ml-1">
          <mt-icon :path="mdiClose" class="icon-close" />
        </span>
      </div>
    </router-link>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { mdiClose } from '@mdi/js';

export default {
  computed: {
    ...mapGetters(['noteTabs', 'selectedNote']),
  },
  data() {
    return {
      mdiClose,
    };
  },
  methods: {
    closeTab(note) {
      const index = this.noteTabs.indexOf(note);
      let nextIndex = -1;
      if (index >= 0) {
        nextIndex = index + 1;
      }
      this.$store.commit('deleteNoteFromTab', { _id: note._id });
      if (this.noteTabs.length === 0) {
        this.$router.push('/');
        return;
      }
      if (note._id === this.selectedNote._id && nextIndex >= 0) {
        if (nextIndex >= this.noteTabs.length) {
          nextIndex = this.noteTabs.length - 1;
        }
        const nextNote = this.noteTabs[nextIndex];
        this.$router.push(`/${nextNote._id}`);
      }
    },
  },
};
</script>

<style lang="scss">
.mt-icon.icon-close {
  margin-top: -3px;
  width: 1rem;
  height: 1rem;
}
</style>
