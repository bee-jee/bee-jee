<template>
  <div
    class="pane collapsible-pane"
    ref="pane"
    :class="{ collapsed: !expanded, expanded: expanded }"
  >
    <button class="pane-header font-weight-bold" @click="toggleExpanded">
      <span class="chevron mx-1 expander" :class="{ collapsed: !expanded }">
        <i class="fas fa-sm fa-chevron-down"></i>
      </span>
      <span>{{title}}</span>
      <slot name="actions"></slot>
    </button>
    <gemini-scrollbar
      class="pane-body"
      v-if="showBody"
      @scroll="handleBodyScroll"
      :initialScrollTop="initialScrollTop"
      ref="scrollView"
    >
      <slot></slot>
    </gemini-scrollbar>
  </div>
</template>

<script>
export default {
  props: {
    title: { type: String },
    expanded: { type: Boolean, default: false },
    initialScrollTop: { type: Number, defatul: 0 },
  },
  methods: {
    toggleExpanded() {
      this.$emit('setExpanded', !this.expanded);
    },
    handleBodyScroll(e) {
      this.$emit('scroll', e);
    },
    scroll(fn) {
      this.$refs.scrollView.scroll(fn);
    },
  },
  data() {
    return {
      showBody: false,
    };
  },
  mounted() {
    this.$refs.pane.addEventListener('transitionstart', () => {
      this.showBody = true;
    });
    this.$refs.pane.addEventListener('transitionend', () => {
      this.showBody = this.expanded;
    });
    this.showBody = this.expanded;
  },
};
</script>
