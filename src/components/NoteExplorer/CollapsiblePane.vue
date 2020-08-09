<template>
  <div
    class="pane collapsible-pane"
    ref="pane"
    :class="{ collapsed: !expanded, expanded: expanded }"
  >
    <button class="pane-header font-weight-bold" @click="toggleExpanded">
      <span v-if="expanded" key="expanded" class="chevron">
        <i class="fas fa-sm fa-chevron-down"></i>
      </span>
      <span v-else key="not-expanded" class="chevron">
        <i class="fas fa-sm fa-chevron-right"></i>
      </span>
      <span>{{title}}</span>
      <slot name="actions"></slot>
    </button>
    <gemini-scrollbar
      class="pane-body"
      v-if="showBody"
      @scroll="handleBodyScroll"
      :initialScrollTop="initialScrollTop"
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
