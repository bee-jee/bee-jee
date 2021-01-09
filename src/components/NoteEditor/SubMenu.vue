<template>
  <b-dropdown-item :disabled="disabled">
    <slot name="label">label</slot>
    <ul class="sub-dropdown" :class="[direction]" ref="subMenu">
      <slot v-bind:direction="direction"></slot>
    </ul>
  </b-dropdown-item>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    direction() {
      return this.$store.getters.tableMenuPosition.menuDirection;
    },
  },
};
</script>
