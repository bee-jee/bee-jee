<template>
  <div role="menuitem" class="p-2">
    <button class="mb-2 btn btn-primary btn-block text-center" @click="select(null)">
      <slot>Transparent</slot>
    </button>

    <div class="grid-row" v-for="(rows, i) in gridColors" :key="i">
      <div
        class="grid-cell color-button"
        :class="{ active: selectedColor === color.toString() }"
        v-for="(color, j) in rows"
        :key="j"
        :style="{ backgroundColor: color.toString() }"
        @click="select(color.toString())"
      ></div>
    </div>
  </div>
</template>

<script>
import tinycolor from 'tinycolor2';

export default {
  props: {
    selectedColor: {
      type: String,
      default: null,
    },
  },
  computed: {
    gridColors() {
      return [
        this.generateGreyColors(10),
        this.generateRainbowColors(10, 90, 50),
        ...this.chunkArray(this.generateRainbowColors(30, 70, 70), 10),
        ...this.chunkArray(this.generateRainbowColors(30, 90, 30), 10),
      ];
    },
  },
  methods: {
    generateGreyColors(count) {
      let colorCode = 255;
      const interval = colorCode / count;
      const colors = [];
      while (colorCode > 0) {
        const color = tinycolor({ r: colorCode, g: colorCode, b: colorCode });
        colorCode -= interval;
        colorCode = Math.floor(colorCode);
        colors.unshift(color);
      }

      return colors;
    },
    generateRainbowColors(count, saturation, lightness) {
      const colors = [];
      const interval = 360 / count;
      const sat = saturation < 0 ? 0 : saturation > 100 ? 100 : saturation;
      const light = lightness < 0 ? 0 : lightness > 100 ? 100 : lightness;
      let hue = 0;

      while (hue < 360) {
        const hsl = `hsl(${hue},${sat}%,${light}%)`;
        const color = tinycolor(hsl);
        colors.unshift(color);
        hue += interval;
      }

      return colors;
    },
    chunkArray(arr, size) {
      const results = [];
      for (let i = 0; i < arr.length; i += size) {
        results.push(arr.slice(i, i + size));
      }
      return results;
    },
    select(color) {
      this.$emit('select', color);
    },
  },
};
</script>
