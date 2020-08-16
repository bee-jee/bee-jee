<template>
  <div>
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
      v-if="visibility === 'anyone_with_link' && note._id"
      :value="getViewSharedUrl(note)"
      ref="link"
      @click="selectLink"
    />
    <small v-if="visibility === 'anyone_with_link' && !note._id" class="text-info">
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
      });
    },
    sharedUsers(newValue) {
      this.$emit('input', {
        visibility: this.visibility,
        sharedUsers: newValue,
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
      }
    },
    onValueChange() {
      this.$emit('input', {
        visibility: this.visibility,
        sharedUsers: this.sharedUsers,
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
  },
  mounted() {
    this.readDataFromValue();
    this.onValueChange();
  },
};
</script>
