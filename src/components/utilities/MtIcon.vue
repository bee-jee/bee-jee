<template>
  <svg :class="classes" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path :d="path" />
  </svg>
</template>

<script>
export default {
  name: 'mt-icon',

  props: {
    path: {
      type: String,
      default: null,
    },
    classNames: {
      type: Array,
      default: () => [],
    },
  },

  computed: {
    classes() {
      return [
        'mt-icon',
      ].concat(this.classNames);
    },
  },
};
</script>

<style scoped>
.mt-icon {
  position: relative;
  color: inherit;
  fill: currentColor;
  height: 1.5rem;
  width: 1.5rem;
}
.mt-icon.sm {
  height: 1.2rem;
  width: 1.2rem;
}
</style>
