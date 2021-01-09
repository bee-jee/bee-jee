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
      <small>{{ numCols }} X {{ numRows }}</small>
    </div>
  </div>
</template>

<script>
const MIN_WIDTH = 5;
const MIN_HEIGHT = 5;

const MAX_WIDTH = 20;
const MAX_HEIGHT = 20;

export default {
  props: {
    direction: {
      type: String,
      default: 'right',
    },
  },
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
      const isWithinHor = (value) => {
        if (this.direction === 'left') {
          const realX = this.width - value - 1;
          return this.hoverX >= realX;
        } else {
          return value <= this.hoverX;
        }
      };
      for (let i = 0; i < this.height; i++) {
        const rows = [];
        for (let j = 0; j < this.width; j++) {
          rows.push({
            hovered: isWithinHor(j) && i <= this.hoverY,
          });
        }
        grid.push(rows);
      }
      return grid;
    },
    numCols() {
      if (this.hoverX >= 0) {
        return this.hoverX + 1;
      }
      return 0;
    },
    numRows() {
      if (this.hoverY >= 0) {
        return this.hoverY + 1;
      }
      return 0;
    },
  },
  methods: {
    hoverCell(x, y) {
      if (this.direction === 'left') {
        x = this.width - x - 1;
      }

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
      x = this.width - x - 1;
      this.$emit('select', { x, y });
    },
    rightIterator() {
      let value = 0;
      const end = this.width;

      return {
        next() {
          value++;
        },
        value() {
          return value;
        },
        isEnd() {
          return value === end;
        },
        fromEnd(curr) {
          return end - curr;
        },
      };
    },
    leftIterator() {
      let value = this.width;
      const end = 0;

      return {
        next() {
          value--;
        },
        value() {
          return value;
        },
        isEnd() {
          return value === end;
        },
        fromEnd(curr) {
          return curr - end;
        },
      };
    },
    getRowIterator() {
      if (this.direction === 'left') {
        return this.leftIterator();
      } else {
        return this.rightIterator();
      }
    },
  },
};
</script>
