<template>
  <div class="d-inline">
    <b-dropdown
      variant="link"
      :toggle-class="`menubar__button text-decoration-none ${toggleClass} ${disabled ? 'disabled' : ''}`"
      no-caret
      @show="handleToggleClick"
      @shown="onMenuShown"
      @hidden="onMenuHidden"
      ref="menu"
    >
      <template v-slot:button-content>
        <slot name="button-content">...</slot>
      </template>
      <slot></slot>
    </b-dropdown>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: '',
    },
    position: {
      type: Object,
      default: () => ({ top: 0, left: 0 }),
    },
    'toggleClass': {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    hasDefaultSlot() {
      return !!this.$slots.default;
    },
  },
  methods: {
    onMenuShown() {
      this.$emit('shown');
    },
    onMenuHidden() {
      this.$emit('hidden');
    },
    hide() {
      this.$refs.menu.hide();
    },
    handleToggleClick(e) {
      this.$emit('click', e);
    },
  },
  watch: {
    position() {
      const menu = this.$refs.menu.$refs.menu;
      menu.style.top = `${this.position.top}px`;
      menu.style.left = `${this.position.left}px`;
    },
  },
};
</script>
