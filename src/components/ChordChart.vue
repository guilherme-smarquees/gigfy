<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title:    String,
  composer: String,
  timeNum:  String,
  timeDen:  String,
  keyRoot:  String,
  keyMode:  String,
  bars:     Array,
})
const emit = defineEmits(['update:bars'])

const selectedBar = ref(0)
const canvasComp  = ref(null)

const beatsPerBar = computed(() => parseInt(props.timeNum) || 4)

function selectBar(i) {
  selectedBar.value = Math.min(i, props.bars.length - 1)
}

function addBar() {
  const n = beatsPerBar.value
  const newBar = {
    beats: Array.from({ length: n }, () => [{ root: '', qual: '' }]),
    barRepeat: false,
    sectionStart: false,
    repeatEnd: 0,
  }
  const next = [...props.bars, newBar]
  emit('update:bars', next)
  selectedBar.value = next.length - 1
}

function removeBar() {
  if (props.bars.length <= 1) return
  const next = props.bars.filter((_, i) => i !== selectedBar.value)
  emit('update:bars', next)
  if (selectedBar.value >= next.length) selectedBar.value = next.length - 1
}
</script>

<template>
  <div class="chart-card">
    <ChartToolbar
      :bars="bars"
      :selectedBar="selectedBar"
      @select="selectBar"
      @add="addBar"
      @remove="removeBar"
      @exportPNG="canvasComp?.exportPNG()"
      @exportPDF="canvasComp?.exportPDF()"
    />

    <BeatEditor
      :bars="bars"
      :selectedBar="selectedBar"
      :beatsPerBar="beatsPerBar"
      @update="v => emit('update:bars', v)"
    />

    <p class="hint">
      Campo vazio = barra de repetição ( / ) &nbsp;·&nbsp;
      <code>b</code> = bemol &nbsp;·&nbsp;
      <code>#</code> = sustenido &nbsp;·&nbsp;
      Use <strong>+</strong> no tempo para adicionar N acordes
    </p>

    <ChartCanvas
      ref="canvasComp"
      :title="title"
      :composer="composer"
      :timeNum="timeNum"
      :timeDen="timeDen"
      :keyRoot="keyRoot"
      :keyMode="keyMode"
      :bars="bars"
    />
  </div>
</template>

<style scoped>
.chart-card {
  border: 1px solid #BAD1EA;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 4px 24px rgba(10, 40, 100, 0.10),
    0 1px 4px  rgba(10, 40, 100, 0.06);
}
.hint {
  font-size: 11px;
  color: #88AACC;
  padding: 6px 12px 8px;
  border-bottom: 1px solid #E0ECF7;
  line-height: 1.6;
}
.hint code, .hint strong {
  background: #E8F1FC;
  color: #1D4ED8;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}
</style>
