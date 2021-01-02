<template>
  <div>
    <div class="form-group form-check">
      <input type="checkbox" class="form-check-input" id="guest-access" v-model="guestAccess" />
      <label for="guest-access" class="form-check-label">
        Guest access (will not require login)
      </label>
    </div>
    <div class="form-group" v-if="guestAccess">
      <template v-if="note._id">
        <input
          type="text"
          class="form-control"
          readonly
          :value="getGuestAccessUrl(note)"
          ref="guestAccessLink"
          @click="selectLink"
        />
      </template>
      <template v-else>
        <small class="text-info">
          The link will be available after the note is created
        </small>
      </template>
    </div>
    <h3>Collaboration</h3>
    <div class="form-group">
      <select
        v-model="visibility"
        class="form-control"
        :class="{ 'is-invalid': this.errors.has('visibility') }"
      >
        <option value="private">Private</option>
        <option value="anyone_with_link">Anyone with the link</option>>
        <option value="users">Users</option>
      </select>
      <span
        class="invalid-feedback"
        v-for="error in errors.getErrors('visibility')"
        :key="error"
      >{{error}}</span>
    </div>
    <user-share v-if="visibility === 'users'" v-model="sharedUsers" />
    <input
      type="text"
      class="form-control"
      readonly
      v-if="(visibility === 'anyone_with_link' || visibility === 'users') && note._id"
      :value="getViewSharedUrl(note)"
      ref="link"
      @click="selectLink"
    />
    <small v-if="(visibility === 'anyone_with_link' || visibility === 'users') && !note._id" class="text-info">
      The link will be available after the note is created
    </small>
  </div>
</template>

<script>
import UserShare from './UserShare';

export default {
  props: ['value', 'errors', 'note'],
  components: {
    UserShare,
  },
  data() {
    return {
      visibility: 'private',
      sharedUsers: [],
      guestAccess: false,
    };
  },
  watch: {
    visibility(newValue) {
      if (newValue !== 'users') {
        this.sharedUsers = [];
      }
      this.$emit('input', {
        visibility: newValue,
        sharedUsers: this.sharedUsers,
        guestAccess: this.guestAccess,
      });
    },
    sharedUsers(newValue) {
      this.$emit('input', {
        visibility: this.visibility,
        sharedUsers: newValue,
        guestAccess: this.guestAccess,
      });
    },
    guestAccess(newValue) {
      this.$emit('input', {
        visibility: this.visibility,
        sharedUsers: this.sharedUsers,
        guestAccess: newValue,
      });
    },
    value(newValue) {
      this.readDataFromValue(newValue);
    },
  },
  methods: {
    readDataFromValue(newValue) {
      if (newValue === undefined) {
        newValue = this.value;
      }
      if (newValue) {
        this.visibility = newValue.visibility || 'private';
        this.sharedUsers = newValue.sharedUsers || [];
        this.guestAccess = newValue.guestAccess || false;
      }
    },
    onValueChange() {
      this.$emit('input', {
        visibility: this.visibility,
        sharedUsers: this.sharedUsers,
        guestAccess: this.guestAccess,
      });
    },
    getViewSharedUrl(note) {
      if (!note._id) {
        return '';
      }
      const route = this.$router.resolve({
        name: 'view-shared-note',
        params: {
          id: note._id,
        },
      });
      return `${location.origin}${location.pathname}${location.query || ''}${route.href}`;
    },
    selectLink(e) {
      e.target.select();
    },
    getGuestAccessUrl(note) {
      if (!note._id) {
        return '';
      }
      const route = this.$router.resolve({
        name: 'view-guest-access-note',
        params: {
          id: note._id,
        },
      });
      return `${location.origin}${location.pathname}${location.query || ''}${route.href}`;
    },
  },
  mounted() {
    this.readDataFromValue();
    this.onValueChange();
  },
};
</script>
