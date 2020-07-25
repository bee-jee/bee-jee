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
  </div>
</template>

<script>
import UserShare from './UserShare';

export default {
  props: ['value', 'errors'],
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
  },
  mounted() {
    this.readDataFromValue();
    this.onValueChange();
  },
};
</script>
