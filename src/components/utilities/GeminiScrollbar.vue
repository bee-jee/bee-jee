<template>
  <div ref="geminiScrollbar">
    <div class="gm-scrollbar -vertical">
      <div class="thumb"></div>
    </div>
    <div class="gm-scrollbar -horizontal">
      <div class="thumb"></div>
    </div>
    <div class="gm-scroll-view">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import GeminiScrollbar from 'gemini-scrollbar';

export default {
  props: {
    autoCreate: {
      type: Boolean,
      default: true,
    },
    autoshow: {
      type: Boolean,
      default: false,
    },
    forceGemini: {
      type: Boolean,
      default: false,
    },
    minThumbSize: {
      type: Number,
      default: 20,
    },
  },
  mounted() {
    this.geminiScrollbar = new GeminiScrollbar({
      element: this.$refs.geminiScrollbar,
      createElements: false,
      onResize: () => {
        this.$emit('resize');
      },
      ...this.$props,
    });
    if (this.autoCreate) {
      this.geminiScrollbar.create();
    }
    this.$emit('ready', this.geminiScrollbar);
  },
  updated() {
    if (this.geminiScrollbar) {
      this.geminiScrollbar.update();
    }
  },
  beforeDestroy() {
    if (this.geminiScrollbar) {
      this.geminiScrollbar.destroy();
    }
    this.geminiScrollbar = null;
  },
};
</script>
