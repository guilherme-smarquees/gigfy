<script setup>
import { ref, computed, watch } from 'vue'

const songTitle = ref('')
const composer  = ref('')
const timeNum   = ref('4')
const timeDen   = ref('4')
const keyRoot   = ref('C')
const keyMode   = ref('maior')

const mkChord = (root = '', qual = '') => ({ root, qual })
const mkBeat  = (...chords) => (chords.length ? chords : [mkChord()])
const mkBar   = (...beats)  => ({ beats, barRepeat: false, sectionStart: false, repeatEnd: 0 })

const bars = ref([
  mkBar(mkBeat(), mkBeat(), mkBeat(), mkBeat()),
  mkBar(mkBeat(), mkBeat(), mkBeat(), mkBeat()),
  mkBar(mkBeat(), mkBeat(), mkBeat(), mkBeat()),
  mkBar(mkBeat(), mkBeat(), mkBeat(), mkBeat()),
])

const beatsPerBar = computed(() => parseInt(timeNum.value) || 4)

watch(beatsPerBar, n => {
  bars.value = bars.value.map(bar => ({
    ...bar,
    beats: Array.from({ length: n }, (_, i) => {
      const beat = bar.beats?.[i]
      return Array.isArray(beat) && beat.length ? beat : [mkChord()]
    }),
  }))
})
</script>

<template>
  <div class="page">
    <SongHeader v-model:title="songTitle" v-model:composer="composer" />
    <MetaRow
      v-model:timeNum="timeNum"
      v-model:timeDen="timeDen"
      v-model:keyRoot="keyRoot"
      v-model:keyMode="keyMode"
    />
    <ChordChart
      :title="songTitle"
      :composer="composer"
      :timeNum="timeNum"
      :timeDen="timeDen"
      :keyRoot="keyRoot"
      :keyMode="keyMode"
      v-model:bars="bars"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 780px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
