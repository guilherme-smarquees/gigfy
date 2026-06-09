<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import jsPDF from 'jspdf'

const props = defineProps({
  title:    String,
  composer: String,
  timeNum:  String,
  timeDen:  String,
  keyRoot:  String,
  keyMode:  String,
  bars:     Array,   // { beats: Beat[][], barRepeat: boolean, repeatEnd: number }[]
})

const canvasRef = ref(null)

const FLAT  = '♭'
const SHARP = '♯'

const PAD_CONST   = 28
const TOP_H_CONST = 64
const ROW_H_CONST = 76
const BOT_H_CONST = 36

function accidental(s) {
  return s.replace(/b/g, FLAT).replace(/#/g, SHARP)
}

function qualDisplay(q) {
  const map = {
    'maj7': 'maj7',  '7': '7',    'm7': 'm7',   'm7b5': 'm7' + FLAT + '5',
    'dim7': 'dim7',  'sus4': 'sus4', 'sus2': 'sus2', 'maj': 'maj',
    'm': 'm',   '6': '6',   '9': '9',    'maj9': 'maj9',  'm9': 'm9',
    'add9': 'add9',  '7#11': '7' + SHARP + '11',
    '7b9':  '7' + FLAT  + '9',  '7#9':  '7' + SHARP + '9',
    '13': '13',  'm6': 'm6',
  }
  return map[q] ?? q
}

// ── % simile mark: dot / slash / dot ─────────────────────
// scale=1  → beat repeat  (fits in one beat cell)
// scale=2  → bar repeat   (full-bar, centered)
function drawPercent(ctx, cx, cy, color, scale = 1) {
  const dotR  = 2.8 * scale
  const gap   = 7   * scale      // distance center → dot center
  const h     = 18  * scale
  const sw    = 3.5 * scale
  const lean  = 7   * scale

  // Upper-left dot
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx - gap * 0.9, cy - gap * 0.55, dotR, 0, Math.PI * 2)
  ctx.fill()

  // Lower-right dot
  ctx.beginPath()
  ctx.arc(cx + gap * 0.9, cy + gap * 0.55, dotR, 0, Math.PI * 2)
  ctx.fill()

  // Central diagonal slash (parallelogram)
  const bx = cx - lean / 2, by = cy + h / 2
  const tx = cx + lean / 2, ty = cy - h / 2
  const dLen = Math.hypot(lean, h)
  const px = h / dLen, py = lean / dLen
  const half = sw / 2
  ctx.beginPath()
  ctx.moveTo(bx + px * half, by + py * half)
  ctx.lineTo(bx - px * half, by - py * half)
  ctx.lineTo(tx - px * half, ty - py * half)
  ctx.lineTo(tx + px * half, ty + py * half)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const DPR     = window.devicePixelRatio || 1
  const W       = Math.max((canvas.parentElement?.clientWidth ?? 660) - 32, 300)
  const beats   = parseInt(props.timeNum) || 4
  const barsArr = props.bars ?? []
  const nBars   = barsArr.length

  const PAD   = PAD_CONST
  const TOP_H = TOP_H_CONST
  const ROW_H = ROW_H_CONST
  const BOT_H = BOT_H_CONST
  const H     = TOP_H + nBars * ROW_H + BOT_H

  canvas.width        = W * DPR
  canvas.height       = H * DPR
  canvas.style.width  = W + 'px'
  canvas.style.height = H + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(DPR, DPR)

  // ── Palette ─────────────────────────────────────────────
  const BG         = '#F8FBFF'
  const CELL_BG    = '#FFFFFF'
  const INK        = '#0D1F3C'
  const QUAL_C     = '#2B5A92'
  const SIM_C      = '#7A9DBF'    // simile "%" colour
  const CELL_LINE  = '#9BBCD8'
  const BEAT_LINE  = '#C8DCF0'
  const CHORD_LINE = '#DDE9F5'
  const DLINE      = '#1A3D6B'
  const SUB        = '#6A8DAE'
  const RPT        = '#1D55CC'
  const BAR_NUM    = '#A8C5DC'
  const FONT       = "'Inter', system-ui, sans-serif"

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // ── Header ──────────────────────────────────────────────
  ctx.fillStyle = INK
  ctx.font = `600 18px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText(props.title || '', W / 2, 26)

  // Key label (top-left)
  if (props.keyRoot) {
    const flat = props.keyRoot.includes('b') ? props.keyRoot.replace('b', '♭') : props.keyRoot
    const keyLabel = flat + (props.keyMode === 'menor' ? 'm' : '')
    ctx.fillStyle = RPT
    ctx.font = `600 18px ${FONT}`
    ctx.textAlign = 'left'
    ctx.fillText(keyLabel, PAD, 26)
  }

  if (props.composer) {
    ctx.fillStyle = SUB
    ctx.font = `italic 400 11px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillText(props.composer, W - PAD, 46)
  }

  ctx.strokeStyle = CELL_LINE
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(PAD, TOP_H - 8)
  ctx.lineTo(W - PAD, TOP_H - 8)
  ctx.stroke()

  const GRID_X = PAD + 7
  const GRID_W = W - 2 * (PAD + 7)
  const BASE_Y = TOP_H
  const gridH  = nBars * ROW_H
  const GAP    = 4

  // ── Outer double bar lines ───────────────────────────────
  const drawVLine = (x, lw) => {
    ctx.strokeStyle = DLINE; ctx.lineWidth = lw
    ctx.beginPath(); ctx.moveTo(x, BASE_Y); ctx.lineTo(x, BASE_Y + gridH); ctx.stroke()
  }
  drawVLine(PAD,        2.5)
  drawVLine(PAD + 5,    0.75)
  drawVLine(W - PAD - 5, 0.75)
  drawVLine(W - PAD,    2.5)

  // ── Section marker sets (explicit flags on each bar) ─────
  const sectionStarts = new Set(
    barsArr.reduce((acc, b, i) => { if (b?.sectionStart) acc.push(i); return acc }, [])
  )

  // ── Bar rows ─────────────────────────────────────────────
  for (let bi = 0; bi < nBars; bi++) {
    const barObj = barsArr[bi] ?? { beats: [], barRepeat: false, repeatEnd: 0 }
    const y   = BASE_Y + bi * ROW_H
    const mY  = y + ROW_H / 2
    const BEAT_W = GRID_W / beats
    const secRepeat   = barObj.repeatEnd ?? 0
    const isSectionStart = sectionStarts.has(bi)
    const isSectionEnd   = secRepeat > 0

    // Cell background + border
    ctx.fillStyle = CELL_BG
    ctx.beginPath()
    ctx.roundRect(GRID_X + GAP / 2, y + GAP / 2, GRID_W - GAP, ROW_H - GAP, 3)
    ctx.fill()
    ctx.strokeStyle = CELL_LINE
    ctx.lineWidth = 1
    ctx.stroke()

    // ── Section start: ||: drawn on left of cell ─────────────
    if (isSectionStart) {
      const lx = GRID_X + GAP / 2 + 3
      const yT = y + GAP / 2 + 4
      const yB = y + ROW_H - GAP / 2 - 4
      ctx.strokeStyle = DLINE
      ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(lx, yT); ctx.lineTo(lx, yB); ctx.stroke()
      ctx.lineWidth = 0.75
      ctx.beginPath(); ctx.moveTo(lx + 5, yT); ctx.lineTo(lx + 5, yB); ctx.stroke()
      ctx.fillStyle = DLINE
      ctx.beginPath(); ctx.arc(lx + 10, mY - 6, 2.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(lx + 10, mY + 6, 2.5, 0, Math.PI * 2); ctx.fill()
    }

    // ── Section end: :|| drawn on right of cell ──────────────
    if (isSectionEnd) {
      const rx = GRID_X + GRID_W - GAP / 2 - 3
      const yT = y + GAP / 2 + 4
      const yB = y + ROW_H - GAP / 2 - 4
      ctx.fillStyle = DLINE
      ctx.beginPath(); ctx.arc(rx - 10, mY - 6, 2.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(rx - 10, mY + 6, 2.5, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = DLINE
      ctx.lineWidth = 0.75
      ctx.beginPath(); ctx.moveTo(rx - 5, yT); ctx.lineTo(rx - 5, yB); ctx.stroke()
      ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(rx, yT); ctx.lineTo(rx, yB); ctx.stroke()
      ctx.fillStyle = RPT
      ctx.font = `700 10px ${FONT}`
      ctx.textAlign = 'right'
      ctx.fillText(secRepeat + '×', rx - 13, yB + 2)
    }

    // Bar number (shift right to clear the ||: when present)
    ctx.fillStyle = BAR_NUM
    ctx.font = `400 9px ${FONT}`
    ctx.textAlign = 'left'
    ctx.fillText(bi + 1, GRID_X + (isSectionStart ? 18 : 5), y + 12)

    // ── Bar repeat: draw large % centred ────────────────────
    if (barObj.barRepeat) {
      drawPercent(ctx, GRID_X + GRID_W / 2, mY, SIM_C, 1.8)
      continue
    }

    // ── Normal bar ──────────────────────────────────────────
    const beatsArr = barObj.beats ?? []

    // Time signature in bar 0
    if (bi === 0) {
      ctx.fillStyle = DLINE
      ctx.font = `600 13px ${FONT}`
      ctx.textAlign = 'left'
      ctx.fillText(props.timeNum, GRID_X + 5, mY - 2)
      ctx.fillText(props.timeDen, GRID_X + 5, mY + 14)
    }

    // Beat separator lines
    for (let s = 1; s < beats; s++) {
      ctx.strokeStyle = BEAT_LINE
      ctx.lineWidth = 0.75
      ctx.beginPath()
      ctx.moveTo(GRID_X + s * BEAT_W, y + 8)
      ctx.lineTo(GRID_X + s * BEAT_W, y + ROW_H - 8)
      ctx.stroke()
    }

    // Beats
    for (let s = 0; s < beats; s++) {
      const rawBeat = beatsArr[s]
      const beat    = Array.isArray(rawBeat) && rawBeat.length ? rawBeat : [{ root: '', qual: '' }]
      const n       = beat.length
      const bx      = GRID_X + s * BEAT_W
      const CHORD_W = BEAT_W / n

      // Chord sub-dividers
      for (let ci = 1; ci < n; ci++) {
        ctx.strokeStyle = CHORD_LINE
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(bx + ci * CHORD_W, y + 10)
        ctx.lineTo(bx + ci * CHORD_W, y + ROW_H - 10)
        ctx.stroke()
      }

      for (let ci = 0; ci < n; ci++) {
        const chord = beat[ci] ?? { root: '', qual: '' }
        let sCx = bx + ci * CHORD_W + CHORD_W / 2
        if (bi === 0 && s === 0 && ci === 0) sCx += 10   // clear time sig

        if (chord.root) {
          const fs = n > 1 ? 14 : 18
          const qs = n > 1 ? 9  : 10
          ctx.fillStyle = INK
          ctx.font = `600 ${fs}px ${FONT}`
          ctx.textAlign = 'center'
          ctx.fillText(accidental(chord.root), sCx, mY + 4)
          if (chord.qual) {
            ctx.fillStyle = QUAL_C
            ctx.font = `400 ${qs}px ${FONT}`
            ctx.fillText(qualDisplay(chord.qual), sCx, mY + 15)
          }
        } else {
          // Beat repeat → "%" simile mark
          const sc = n > 1 ? 0.75 : 1
          drawPercent(ctx, sCx, mY, SIM_C, sc)
        }
      }
    }
  }

}

const showPdfDialog  = ref(false)
const barsPerPageVal = ref('')
const barFromVal     = ref('')
const barToVal       = ref('')

function slug() {
  return (props.title || 'chord-chart').toLowerCase().replace(/\s+/g, '-')
}

function exportPNG() {
  const canvas = canvasRef.value
  if (!canvas) return
  const a    = document.createElement('a')
  a.href     = canvas.toDataURL('image/png')
  a.download = slug() + '.png'
  a.click()
}

// Opens the dialog; actual work is in doExportPDF
function exportPDF() {
  barsPerPageVal.value = ''
  barFromVal.value     = '1'
  barToVal.value       = String((props.bars ?? []).length)
  showPdfDialog.value  = true
}

function doExportPDF() {
  showPdfDialog.value = false
  const canvas = canvasRef.value
  if (!canvas) return

  const DPR    = window.devicePixelRatio || 1
  const imgW   = canvas.width / DPR

  const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 12
  const availW = 210 - 2 * margin
  const availH = 297 - 2 * margin
  const scale  = availW / imgW

  const TOP_H  = TOP_H_CONST
  const ROW_H  = ROW_H_CONST
  const BOT_H  = BOT_H_CONST
  const nBars  = (props.bars ?? []).length

  // Range (1-indexed from user → 0-indexed internally)
  const fromBar   = Math.max(0,         (parseInt(barFromVal.value) || 1)     - 1)
  const toBar     = Math.min(nBars - 1, (parseInt(barToVal.value)   || nBars) - 1)
  const nSelected = Math.max(1, toBar - fromBar + 1)

  // Rows per page
  const manualRows  = parseInt(barsPerPageVal.value)
  const availH_px   = availH / scale
  const rowsPage1   = manualRows > 0 ? manualRows : Math.max(1, Math.floor((availH_px - TOP_H - BOT_H) / ROW_H))
  const rowsPerPage = manualRows > 0 ? manualRows : Math.max(1, Math.floor((availH_px - BOT_H) / ROW_H))

  // Compose a temp canvas: header (first page only) + selected bar rows
  function addSlice(absFirstBar, rowsAvail, isPageOne, isLast) {
    const sliceH = (isPageOne ? TOP_H : 0) + rowsAvail * ROW_H + (isLast ? BOT_H : 0)
    const tmp    = document.createElement('canvas')
    tmp.width    = canvas.width
    tmp.height   = Math.ceil(sliceH * DPR)
    const tCtx   = tmp.getContext('2d')

    let destY = 0
    if (isPageOne) {
      tCtx.drawImage(canvas, 0, 0, canvas.width, Math.ceil(TOP_H * DPR), 0, 0, canvas.width, Math.ceil(TOP_H * DPR))
      destY = Math.ceil(TOP_H * DPR)
    }

    const srcRowY = Math.round((TOP_H + absFirstBar * ROW_H) * DPR)
    const srcRowH = Math.ceil(rowsAvail * ROW_H * DPR)
    tCtx.drawImage(canvas, 0, srcRowY, canvas.width, srcRowH, 0, destY, canvas.width, srcRowH)

    if (isLast && BOT_H > 0) {
      tCtx.fillStyle = '#F8FBFF'
      tCtx.fillRect(0, destY + srcRowH, canvas.width, Math.ceil(BOT_H * DPR))
    }

    pdf.addImage(tmp.toDataURL('image/png'), 'PNG', margin, margin, availW, sliceH * scale)
  }

  let barsDone = 0
  let pageNum  = 0

  while (barsDone < nSelected) {
    const rowsThisPage = pageNum === 0 ? rowsPage1 : rowsPerPage
    const rowsAvail    = Math.min(rowsThisPage, nSelected - barsDone)
    const isLast       = barsDone + rowsAvail >= nSelected

    if (pageNum > 0) pdf.addPage()
    addSlice(fromBar + barsDone, rowsAvail, pageNum === 0, isLast)

    barsDone += rowsAvail
    pageNum++
  }

  pdf.save(slug() + '.pdf')
}

defineExpose({ exportPNG, exportPDF })

onMounted(() => {
  draw()
  document.fonts.ready.then(draw)
  window.addEventListener('resize', draw)
})
onUnmounted(() => window.removeEventListener('resize', draw))

watch(() => [props.title, props.composer, props.timeNum, props.timeDen, props.keyRoot, props.keyMode], draw)
watch(() => props.bars, draw, { deep: true })
</script>

<template>
  <div class="canvas-wrap">
    <canvas ref="canvasRef" />

    <!-- PDF options dialog -->
    <Teleport to="body">
      <div v-if="showPdfDialog" class="pdf-overlay" @click.self="showPdfDialog = false">
        <div class="pdf-dialog">
          <p class="pdf-dialog-title">Exportar PDF</p>

          <div class="pdf-dialog-row">
            <label class="pdf-dialog-label">
              Do compasso
              <input
                v-model="barFromVal"
                class="pdf-dialog-input"
                type="number"
                min="1"
                :max="barToVal || (props.bars ?? []).length"
                autofocus
                @keyup.enter="doExportPDF"
                @keyup.esc="showPdfDialog = false"
              />
            </label>
            <span class="pdf-dialog-sep">até</span>
            <label class="pdf-dialog-label">
              compasso
              <input
                v-model="barToVal"
                class="pdf-dialog-input"
                type="number"
                :min="barFromVal || 1"
                :max="(props.bars ?? []).length"
                @keyup.enter="doExportPDF"
                @keyup.esc="showPdfDialog = false"
              />
            </label>
          </div>

          <label class="pdf-dialog-label">
            Compassos por página
            <input
              v-model="barsPerPageVal"
              class="pdf-dialog-input"
              type="number"
              min="1"
              placeholder="automático"
              @keyup.enter="doExportPDF"
              @keyup.esc="showPdfDialog = false"
            />
          </label>
          <p class="pdf-dialog-hint">Deixe em branco para distribuição automática</p>

          <div class="pdf-dialog-actions">
            <button class="pdf-btn pdf-btn-cancel" @click="showPdfDialog = false">Cancelar</button>
            <button class="pdf-btn pdf-btn-ok" @click="doExportPDF">Exportar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.canvas-wrap {
  padding: 16px;
  background: #F4F9FF;
}
canvas {
  display: block;
  width: 100%;
  border-radius: 6px;
  box-shadow: 0 1px 8px rgba(10, 40, 80, 0.08);
}

/* PDF dialog */
.pdf-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 30, 70, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.pdf-dialog {
  background: #fff;
  border-radius: 14px;
  padding: 24px 28px 20px;
  width: 300px;
  box-shadow: 0 8px 40px rgba(10, 40, 100, 0.18);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pdf-dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: #0D1F3C;
  margin: 0;
}
.pdf-dialog-label {
  font-size: 12px;
  color: #4B6B8A;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pdf-dialog-input {
  font-size: 14px;
  font-family: inherit;
  padding: 7px 10px;
  border: 1px solid #BAD1EA;
  border-radius: 8px;
  color: #0D1F3C;
  outline: none;
  transition: border-color 0.15s;
}
.pdf-dialog-input:focus { border-color: #1D4ED8; }
.pdf-dialog-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.pdf-dialog-row .pdf-dialog-label { flex: 1; }
.pdf-dialog-sep {
  font-size: 12px;
  color: #4B6B8A;
  padding-bottom: 9px;
  white-space: nowrap;
}
.pdf-dialog-hint {
  font-size: 11px;
  color: #88AACC;
  margin: -8px 0 0;
}
.pdf-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.pdf-btn {
  font-size: 13px;
  font-family: inherit;
  padding: 7px 16px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.12s;
}
.pdf-btn-cancel {
  background: #F0F5FF;
  color: #2A4E78;
  border-color: #BAD1EA;
}
.pdf-btn-cancel:hover { background: #E0ECF7; }
.pdf-btn-ok {
  background: #1D4ED8;
  color: #fff;
}
.pdf-btn-ok:hover { background: #1741B8; }
</style>
