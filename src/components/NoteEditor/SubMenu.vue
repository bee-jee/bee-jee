<template>
  <b-dropdown-item>
    <slot name="label">label</slot>
    <ul class="sub-dropdown">
      <slot></slot>
    </ul>
  </b-dropdown-item>
</template>

<script>
export default {

}
</script>

<style>

</style>