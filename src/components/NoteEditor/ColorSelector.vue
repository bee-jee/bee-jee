<template>
  <div role="menuitem" class="p-2">
    <button class="mb-2 btn btn-primary btn-block text-center" @click="select(null)">
      <slot>Transparent</slot>
    </button>

    <div class="grid-row" v-for="(rows, i) in gridColors" :key="i">
      <div
        class="grid-cell color-button"
        v-for="(color, j) in rows"
        :key="j"
        :style="{ backgroundColor: color.hex() }"
        @click="select(color.hex())"
      ></div>
    </div>
  </div>
</template>

<script>
import Color from 'color';

export default {
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
        const color = Color({ r: colorCode, g: colorCode, b: colorCode });
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
        const color = Color(hsl);
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
