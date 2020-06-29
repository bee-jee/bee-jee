<template>
  <div class="container-fluid py-3">
    <h4>Settings</h4>
    <template v-for="definition in definitions">
      <div class="form-group row" v-if="definition.type === 'menu'" :key="definition.name">
        <label :for="definition.name" class="col-auto col-form-label">{{definition.name}}</label>
        <div class="col-6">
          <select
            class="form-control"
            :id="definition.name"
            :value="config[definition.name]"
            @change="handleConfigChange($event, definition)"
          >
            <option v-for="value in definition.values" :value="value" :key="value">{{value}}</option>
          </select>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  computed: {
    definitions() {
      return this.$store.getters.config('definitions');
    },
    config() {
      return this.$store.getters.config();
    },
  },
  methods: {
    handleConfigChange(e, definition) {
      this.$store.dispatch('setConfig', definition.name, e.target.value);
    },
  },
}
</script>