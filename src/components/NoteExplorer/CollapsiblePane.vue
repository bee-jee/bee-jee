<template>
  <div class="pane collapsible-pane">
    <button class="pane-header p-1 mt-1 font-weight-bold" @click="toggleExpanded">
      <span v-if="expanded" key="expanded" class="chevron">
        <i class="fas fa-sm fa-chevron-down"></i>
      </span>
      <span v-else key="not-expanded" class="chevron">
        <i class="fas fa-sm fa-chevron-right"></i>
      </span>
      <span>{{title}}</span>
      <slot name="actions"></slot>
    </button>
    <transition name="slide-down">
      <div class="pane-body" v-if="expanded">
        <slot></slot>
      </div>
    </transition>
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
};
</script>
