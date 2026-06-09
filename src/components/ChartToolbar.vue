<script setup>
import { computed } from 'vue'

const props = defineProps({ bars: Array, selectedBar: Number })
defineEmits(['select', 'add', 'remove', 'exportPNG', 'exportPDF'])

const GROUP_SIZE = 4
const barGroups = computed(() => {
  const groups = []
  for (let i = 0; i < props.bars.length; i += GROUP_SIZE) {
    const end = Math.min(i + GROUP_SIZE, props.bars.length)
    groups.push(Array.from({ length: end - i }, (_, j) => i + j))
  }
  return groups
})
</script>

<template>
  <div class="toolbar">
    <!-- Bar selector — grouped by row of 4 (mirrors chart columns) -->
    <div class="toolbar-top">
      <span class="toolbar-label">Editar compasso:</span>
      <div class="bar-groups">
        <template v-for="(group, gi) in barGroups" :key="gi">
          <div class="bar-group">
            <button
              v-for="i in group"
              :key="i"
              class="bar-btn"
              :class="{ active: i === selectedBar }"
              @click="$emit('select', i)"
            >{{ i + 1 }}</button>
          </div>
          <div v-if="gi < barGroups.length - 1" class="group-sep" />
        </template>
      </div>
    </div>

    <!-- Actions -->
    <div class="toolbar-actions">
      <button class="btn" @click="$emit('add')">
        <i class="ti ti-plus" /> Compasso
      </button>
      <button class="btn icon-btn" @click="$emit('remove')">
        <i class="ti ti-trash" />
      </button>
      <div class="flex-grow" />
      <button class="btn" @click="$emit('exportPDF')">
        <i class="ti ti-file-type-pdf" /> PDF
      </button>
      <button class="btn" @click="$emit('exportPNG')">
        <i class="ti ti-download" /> PNG
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #E0ECF7;
  background: linear-gradient(180deg, #F3F8FF 0%, #EAF2FF 100%);
}
.toolbar-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px 8px;
  border-bottom: 1px solid #E0ECF7;
  flex-wrap: wrap;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  flex-wrap: wrap;
}
.toolbar-label {
  font-size: 12px;
  color: #4B6B8A;
  white-space: nowrap;
}
.bar-groups {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.bar-group { display: flex; gap: 3px; }
.group-sep { width: 1px; height: 22px; background: #BAD1EA; }
.bar-btn {
  font-size: 12px;
  min-width: 28px;
  padding: 3px 6px;
  border-radius: 5px;
  background: transparent;
  border: 1px solid #BAD1EA;
  color: #2A4E78;
  cursor: pointer;
  transition: all 0.12s;
  font-family: inherit;
}
.bar-btn:hover { background: #E8F1FC; }
.bar-btn.active { background: #1D4ED8; border-color: #1D4ED8; color: #fff; }
.flex-grow { flex: 1; }
.btn {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 7px;
  background: #fff;
  border: 1px solid #BAD1EA;
  color: #1A3D6B;
  cursor: pointer;
  transition: all 0.12s;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-family: inherit;
}
.btn:hover { background: #E8F1FC; }
.btn.icon-btn { padding: 5px 8px; }
</style>
