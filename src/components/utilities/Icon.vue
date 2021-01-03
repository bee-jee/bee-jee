<template>
  <svg :class="className" xmlns="http://www.w3.org/2000/svg">
    <title v-if="title">{{ title }}</title>
    <use :xlink:href="iconPath" xmlns:xlink="http://www.w3.org/1999/xlink" />
  </svg>
</template>

<script>
export default {
  name: 'icon',
  props: {
    name: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
    classNames: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    iconPath() {
      let icon = require(`@/images/icons/${this.name}.svg`);
      if (Object.prototype.hasOwnProperty.call(icon, 'default')) {
        icon = icon.default;
      }
      return icon.url;
    },
    className() {
      return 'icon icon--' + this.name + ' ' + this.classNames.join(' ');
    },
  },
};
</script>

<style>
.icon {
  position: relative;
  top: -0.1rem;
  fill: currentColor;
  stroke: currentColor;
  height: 1.3rem;
  width: 1.3rem;
}
</style>