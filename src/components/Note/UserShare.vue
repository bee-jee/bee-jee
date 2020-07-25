<template>
  <div>
    <button type="button" class="btn btn-primary mb-3" @click="addUser">+ Add user</button>
    <div v-for="(user, index) in sharedUsers" :key="index" class="row mb-1">
      <div class="col">
        <input type="text" class="form-control" v-model="user.username" @input="onValueChange" />
      </div>
      <div class="col-4 pl-0">
        <select class="form-control" v-model="user.permission" @input="onValueChange">
          <option value="read">Read</option>
          <option value="write">Write</option>
        </select>
      </div>
      <div class="col-auto pl-0">
        <button type="button" class="btn btn-danger" @click="deleteUser(index)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['value'],
  data() {
    return {
      sharedUsers: [],
    };
  },
  methods: {
    addUser() {
      this.sharedUsers.push({
        username: '',
        permission: 'read',
      });
      this.onValueChange();
    },
    deleteUser(index) {
      this.sharedUsers.splice(index, 1);
      this.onValueChange();
    },
    onValueChange() {
      this.$emit('input', this.sharedUsers);
    },
  },
  mounted() {
    if (this.value) {
      this.sharedUsers = this.value;
    }
  },
  watch: {
    value() {
      if (this.value) {
        this.sharedUsers = this.value;
      }
    },
  },
};
</script>
