<script setup>
import { computed } from 'vue'

const QUALS = [
  '', 'maj7', '7', 'm7', 'm7b5', 'dim7', 'sus4', 'sus2',
  'maj', 'm', '6', '9', 'maj9', 'm9', 'add9', '7#11', '7b9', '7#9', '13', 'm6',
]

const props = defineProps({ bars: Array, selectedBar: Number, beatsPerBar: Number })
const emit  = defineEmits(['update'])

// Each bar is now { beats: Beat[][], barRepeat: boolean, sectionStart: boolean, repeatEnd: number }
const currentBarObj = computed(() => props.bars[props.selectedBar] ?? { beats: [], barRepeat: false, sectionStart: false, repeatEnd: 0 })
const isBarRepeat   = computed(() => currentBarObj.value.barRepeat ?? false)

const currentBeats = computed(() => {
  if (isBarRepeat.value) return []
  const raw = currentBarObj.value.beats ?? []
  return Array.from({ length: props.beatsPerBar }, (_, i) => {
    const beat = raw[i]
    return Array.isArray(beat) && beat.length ? beat : [{ root: '', qual: '' }]
  })
})

function patchBar(fn) {
  emit('update', props.bars.map((b, i) => (i === props.selectedBar ? fn(b) : b)))
}

function toggleBarRepeat(e) {
  patchBar(bar => ({ ...bar, barRepeat: e.target.checked }))
}

const isSectionStart = computed(() => currentBarObj.value.sectionStart ?? false)
const repeatEndVal   = computed(() => currentBarObj.value.repeatEnd ?? 0)

function toggleSectionStart(e) {
  patchBar(bar => ({ ...bar, sectionStart: e.target.checked }))
}

function setRepeatEnd(checked, count) {
  if (!checked) {
    patchBar(bar => ({ ...bar, repeatEnd: 0 }))
  } else {
    patchBar(bar => ({ ...bar, repeatEnd: Math.max(1, parseInt(count) || 2) }))
  }
}

function updateRepeatCount(e) {
  const v = Math.max(1, parseInt(e.target.value) || 1)
  patchBar(bar => ({ ...bar, repeatEnd: v }))
}

function setRoot(si, ci, val) {
  patchBar(bar => ({
    ...bar,
    beats: bar.beats.map((beat, bi) =>
      bi !== si ? beat : beat.map((c, ci2) => (ci2 === ci ? { ...c, root: val.trim() } : c))
    ),
  }))
}

function setQual(si, ci, val) {
  patchBar(bar => ({
    ...bar,
    beats: bar.beats.map((beat, bi) =>
      bi !== si ? beat : beat.map((c, ci2) => (ci2 === ci ? { ...c, qual: val } : c))
    ),
  }))
}

function addChord(si) {
  patchBar(bar => ({
    ...bar,
    beats: bar.beats.map((beat, bi) => (bi === si ? [...beat, { root: '', qual: '' }] : beat)),
  }))
}

function removeChord(si, ci) {
  patchBar(bar => ({
    ...bar,
    beats: bar.beats.map((beat, bi) => {
      if (bi !== si || beat.length <= 1) return beat
      return beat.filter((_, ci2) => ci2 !== ci)
    }),
  }))
}
</script>

<template>
  <div class="beat-editor">
    <!-- Header row: label + bar-repeat toggle + section-end toggle -->
    <div class="editor-header">
      <span class="beat-editor-label">
        Compasso <strong>{{ selectedBar + 1 }}</strong>:
      </span>
      <label class="bar-repeat-toggle">
        <input type="checkbox" :checked="isBarRepeat" @change="toggleBarRepeat" />
        <span class="toggle-pct">%</span>
        Repetir compasso anterior
      </label>
      <label class="section-start-toggle">
        <input
          type="checkbox"
          :checked="isSectionStart"
          @change="toggleSectionStart"
        />
        Início de seção
      </label>
      <label class="section-end-toggle">
        <input
          type="checkbox"
          :checked="repeatEndVal > 0"
          @change="e => setRepeatEnd(e.target.checked, repeatEndVal || 2)"
        />
        Fim de seção
      </label>
      <span v-if="repeatEndVal > 0" class="repeat-count-wrap">
        <input
          type="number"
          :value="repeatEndVal"
          min="1"
          max="20"
          class="repeat-count-input"
          @input="updateRepeatCount"
        />
        <span class="repeat-count-x">×</span>
      </span>
    </div>

    <!-- Beats (hidden when barRepeat) -->
    <div v-if="!isBarRepeat" class="beats">
      <template v-for="(beat, si) in currentBeats" :key="si">
        <div class="beat-cell">
          <span class="beat-num">Tempo {{ si + 1 }}</span>

          <div class="chord-list">
            <div v-for="(chord, ci) in beat" :key="ci" class="chord-row">
              <input
                type="text"
                :value="chord.root"
                placeholder="—"
                class="root-input"
                @input="setRoot(si, ci, $event.target.value)"
              />
              <select
                :value="chord.qual"
                class="qual-select"
                @change="setQual(si, ci, $event.target.value)"
              >
                <option v-for="q in QUALS" :key="q" :value="q">{{ q || '(none)' }}</option>
              </select>
              <button v-if="beat.length > 1" class="rm-btn" @click="removeChord(si, ci)">×</button>
            </div>
          </div>

          <button class="add-chord-btn" @click="addChord(si)">
            <i class="ti ti-plus" />
          </button>
        </div>

        <div v-if="si < currentBeats.length - 1" class="beat-sep" />
      </template>
    </div>

    <!-- Bar-repeat placeholder -->
    <div v-else class="bar-repeat-msg">
      <span class="pct-big">%</span>
      Repete o conteúdo do compasso anterior
    </div>
  </div>
</template>

<style scoped>
.beat-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #E0ECF7;
}
.editor-header {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.beat-editor-label {
  font-size: 12px;
  color: #4B6B8A;
  white-space: nowrap;
}
.bar-repeat-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #4B6B8A;
  cursor: pointer;
  user-select: none;
}
.bar-repeat-toggle input[type=checkbox],
.section-end-toggle input[type=checkbox] {
  accent-color: #1D4ED8;
  width: 14px;
  height: 14px;
  cursor: pointer;
}
.section-start-toggle,
.section-end-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #4B6B8A;
  cursor: pointer;
  user-select: none;
}
.repeat-count-wrap {
  display: flex;
  align-items: center;
  gap: 3px;
}
.repeat-count-input {
  width: 42px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 5px;
  background: #E8F1FC;
  border: 1px solid #BAD1EA;
  color: #0D1F3C;
  outline: none;
  font-family: inherit;
  text-align: center;
}
.repeat-count-input:focus { border-color: #3B82F6; }
.repeat-count-x {
  font-size: 12px;
  color: #1D4ED8;
  font-weight: 600;
}
.toggle-pct {
  font-size: 14px;
  font-weight: 700;
  color: #1D4ED8;
}
.bar-repeat-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  color: #4B6B8A;
  font-size: 13px;
}
.pct-big {
  font-size: 30px;
  font-weight: 700;
  color: #7A9DBF;
  line-height: 1;
}
.beats {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: flex-start;
  flex: 1;
}
.beat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 118px;
}
.beat-num {
  font-size: 10px;
  color: #88AACC;
  letter-spacing: 0.02em;
}
.chord-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}
.chord-row {
  display: flex;
  align-items: center;
  gap: 3px;
}
.root-input {
  font-size: 13px;
  padding: 4px 5px;
  border-radius: 6px;
  background: #E8F1FC;
  border: 1px solid #BAD1EA;
  color: #0D1F3C;
  width: 44px;
  text-align: center;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.root-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.18);
}
.qual-select {
  font-size: 12px;
  padding: 4px 4px;
  border-radius: 6px;
  background: #E8F1FC;
  border: 1px solid #BAD1EA;
  color: #0D1F3C;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  flex: 1;
  min-width: 0;
}
.qual-select:focus { border-color: #3B82F6; }
.rm-btn {
  background: none;
  border: none;
  color: #C0D5E8;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 3px;
  border-radius: 3px;
  font-family: inherit;
  line-height: 1;
  transition: color 0.12s;
  flex-shrink: 0;
}
.rm-btn:hover { color: #E05050; }
.add-chord-btn {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 5px;
  background: transparent;
  border: 1px dashed #BAD1EA;
  color: #6B8DAE;
  cursor: pointer;
  transition: all 0.12s;
  font-family: inherit;
  margin-top: 2px;
}
.add-chord-btn:hover {
  background: #E8F1FC;
  border-color: #3B82F6;
  color: #1D4ED8;
  border-style: solid;
}
.beat-sep {
  width: 1px;
  background: #E0ECF7;
  align-self: stretch;
  margin-top: 18px;
  flex-shrink: 0;
}
</style>
