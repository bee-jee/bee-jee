<template>
  <b-dropdown-item :disabled="disabled">
    <slot name="label">label</slot>
    <ul class="sub-dropdown">
      <slot></slot>
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
}
</script>
