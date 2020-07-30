<template>
  <div
    class="pane collapsible-pane"
    ref="pane"
    :class="{ collapsed: !expanded, expanded: expanded }"
  >
    <button class="pane-header px-1 py-0 font-weight-bold" @click="toggleExpanded">
      <span v-if="expanded" key="expanded" class="chevron">
        <i class="fas fa-sm fa-chevron-down"></i>
      </span>
      <span v-else key="not-expanded" class="chevron">
        <i class="fas fa-sm fa-chevron-right"></i>
      </span>
      <span>{{title}}</span>
      <slot name="actions"></slot>
    </button>
    <gemini-scrollbar class="pane-body" v-if="showBody">
      <slot></slot>
    </gemini-scrollbar>
  </div>
</template>

<script>
export default {
  props: {
    title: { type: String },
    expanded: { type: Boolean, default: false },
  },
  methods: {
    toggleExpanded() {
      this.$emit('setExpanded', !this.expanded);
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
