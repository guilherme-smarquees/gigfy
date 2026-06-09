<script setup>
const ROOTS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
const MODES = ['maior', 'menor']

defineProps({ timeNum: String, timeDen: String, keyRoot: String, keyMode: String })
defineEmits(['update:timeNum', 'update:timeDen', 'update:keyRoot', 'update:keyMode'])
</script>

<template>
  <div class="meta-row">
    <span class="meta-label">Compasso</span>
    <div class="time-pair">
      <select
        :value="timeNum"
        class="meta-select"
        @change="$emit('update:timeNum', $event.target.value)"
      >
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
      </select>
      <span class="time-slash">/</span>
      <select
        :value="timeDen"
        class="meta-select"
        @change="$emit('update:timeDen', $event.target.value)"
      >
        <option value="4">4</option>
        <option value="8">8</option>
      </select>
    </div>

    <div class="vsep" />

    <span class="meta-label">Tom</span>
    <select
      :value="keyRoot"
      class="meta-select key-root"
      @change="$emit('update:keyRoot', $event.target.value)"
    >
      <option v-for="r in ROOTS" :key="r" :value="r">{{ r }}</option>
    </select>
    <select
      :value="keyMode"
      class="meta-select key-mode"
      @change="$emit('update:keyMode', $event.target.value)"
    >
      <option v-for="m in MODES" :key="m" :value="m">{{ m }}</option>
    </select>
  </div>
</template>

<style scoped>
.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.meta-label {
  font-size: 12px;
  color: #4B6B8A;
  font-weight: 500;
}
.meta-select {
  font-size: 13px;
  padding: 5px 8px;
  border-radius: 7px;
  background: #E8F1FC;
  border: 1px solid #BAD1EA;
  color: #0D1F3C;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.meta-select:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}
.key-root { min-width: 52px; }
.key-mode { min-width: 72px; }
.time-pair { display: flex; align-items: center; gap: 4px; }
.time-slash { font-size: 14px; color: #6B8DAE; }
.vsep { width: 1px; height: 18px; background: #BAD1EA; margin: 0 2px; }
</style>
