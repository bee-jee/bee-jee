<template>
  <div role="menuitem" class="p-2" @mouseleave="hoverCell(-1, -1)">
    <div class="grid-row" v-for="(rows, i) in grid" :key="i">
      <div
        class="grid-cell"
        :class="{ hovered: cell.hovered }"
        v-for="(cell, j) in rows"
        :key="j"
        @mouseover="hoverCell(j, i)"
        @click="selectCell(j, i)"
      ></div>
    </div>
    <div class="text-center">
      <small>{{ width }} X {{ height }}</small>
    </div>
  </div>
</template>

<script>
const MIN_WIDTH = 5;
const MIN_HEIGHT = 5;

const MAX_WIDTH = 20;
const MAX_HEIGHT = 20;

export default {
  data() {
    return {
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
      hoverX: -1,
      hoverY: -1,
    };
  },
  computed: {
    grid() {
      const grid = [];
      for (let i = 0; i < this.height; i++) {
        const rows = [];
        for (let j = 0; j < this.width; j++) {
          rows.push({
            hovered: j <= this.hoverX && i <= this.hoverY,
          });
        }
        grid.push(rows);
      }
      return grid;
    },
  },
  methods: {
    hoverCell(x, y) {
      this.hoverX = x;
      this.hoverY = y;

      if (x === this.width - 1) {
        this.width++;
      }
      if (y === this.height - 1) {
        this.height++;
      }

      if (x < this.width - 2) {
        this.width = x + 2;
      }
      if (y < this.height - 2) {
        this.height = y + 2;
      }

      if (this.width < MIN_WIDTH) {
        this.width = MIN_WIDTH;
      } else if (this.width > MAX_WIDTH) {
        this.width = MAX_WIDTH;
      }
      if (this.height < MIN_HEIGHT) {
        this.height = MIN_HEIGHT;
      } else if (this.height > MAX_HEIGHT) {
        this.height = MAX_HEIGHT;
      }
    },
    selectCell(x, y) {
      this.$emit('select', { x, y });
    },
  },
};
</script>
