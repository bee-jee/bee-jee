<template>
  <span>
    <template v-for="(span, index) in formatted">
      <span :key="index" v-if="!span.isHighlight">{{ span.text }}</span>
      <span v-else :key="index" :style="{ 'background-color': highlightBg }">{{ span.text }}</span>
    </template>
  </span>
</template>

<script>
import { groupIndexes } from '../../helpers/array';

export default {
  props: {
    text: String,
    indexes: Array,
    shouldHighlight: Boolean,
    highlightBg: {
      type: String,
      default: 'rgba(234, 92, 0, 0.33)',
    },
  },
  computed: {
    formatted() {
      if (!this.shouldHighlight) {
        return [
          {
            text: this.text,
            isHighlight: false,
          },
        ];
      }
      const formatted = [];
      const groupsIndexes = groupIndexes(this.indexes);
      if (groupIndexes.length > 0) {
        let start = 0;
        let groups = [];
        for (let i = 0; i < groupsIndexes.length; i++) {
          groups = groupsIndexes[i];
          if (start < groups[0]) {
            formatted.push({
              text: this.text.slice(start, groups[0]),
              isHighlight: false,
            });
          }
          if (groups.length === 1) {
            formatted.push({
              text: this.text[groups[0]],
              isHighlight: true,
            });
            start = groups[0] + 1;
          } else {
            const slice = this.text.slice(groups[0], groups[groups.length - 1] + 1);
            start = groups[groups.length - 1] + 1;
            formatted.push({
              text: slice,
              isHighlight: true,
            });
          }
        }
        formatted.push({
          text: this.text.slice(groups[groups.length - 1] + 1),
          isHighlight: false,
        });
      } else {
        formatted.push({
          text: this.text,
          isHighlight: false,
        });
      }
      return formatted;
    },
  },
};
</script>
