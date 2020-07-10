<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  created() {
    this.$http.interceptors.response.use(undefined, function (err) {
      if (err.status === 401) {
        this.$router.push('/login');
      }
      throw err;
    });
  },
}
</script>
