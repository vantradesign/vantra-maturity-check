<script setup lang="ts">
import type { AssessmentResult } from '@vantra-design/maturity-core'

/**
 * Hand-drawn SVG rather than a charting library.
 *
 * [Engineering] Four axes and one polygon is about sixty lines of trigonometry;
 * a chart library would be the single largest dependency in the bundle for
 * this. [A11y] The polygon is decorative — `aria-hidden` — because the numbers
 * are stated in the table beside it. A radar chart is a shape, not data a
 * screen reader can use.
 */
const props = defineProps<{ result: AssessmentResult; labels: Record<string, string> }>()

const SIZE = 320
const CENTRE = SIZE / 2

/**
 * The web is the only surface with room to draw this, so the chart takes it:
 * the polygon fills almost the whole box and the labels live in padding
 * outside it.
 *
 * The horizontal padding is measured from the longest label rather than fixed,
 * because "Versionierung" is a third wider than "Versioning" and a community
 * catalog can name a category anything. Guessing one number for every locale
 * means either a clipped word or a chart that wastes half its width.
 */
const RADIUS = SIZE / 2 - 6
const LABEL_GAP = 14

// 11px uppercase at 0.08em tracking, measured empirically. Slight overestimate
// on purpose: erring wide costs a few pixels, erring narrow clips a word.
const CHAR_WIDTH = 7.6
const PAD_Y = 26

const padX = computed(() => {
  const longest = props.result.categories.reduce((max, category) => {
    const label = props.labels[category.categoryId] ?? category.categoryId
    return Math.max(max, label.length)
  }, 0)
  return Math.ceil(longest * CHAR_WIDTH) + LABEL_GAP
})

const viewBox = computed(
  () => `${-padX.value} ${-PAD_Y} ${SIZE + padX.value * 2} ${SIZE + PAD_Y * 2}`,
)

/** Start at twelve o'clock and go clockwise. */
function angleAt(index: number) {
  return (Math.PI * 2 * index) / props.result.categories.length - Math.PI / 2
}

function point(index: number, count: number, value: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  // Scale 1–5 onto 0–1.
  const ratio = Math.max(0, Math.min(1, (value - 1) / 4))
  return {
    x: CENTRE + Math.cos(angle) * RADIUS * ratio,
    y: CENTRE + Math.sin(angle) * RADIUS * ratio,
  }
}

const axes = computed(() =>
  props.result.categories.map((category, index) => {
    const outer = point(index, props.result.categories.length, 5)
    return {
      id: category.categoryId,
      label: props.labels[category.categoryId] ?? category.categoryId,
      outer,
      // A fixed gap past the outer ring, not a multiplier: the same visual
      // distance on every axis regardless of how far the tip is from centre.
      labelX: CENTRE + Math.cos(angleAt(index)) * (RADIUS + LABEL_GAP),
      labelY: CENTRE + Math.sin(angleAt(index)) * (RADIUS + LABEL_GAP),
      // Top and bottom labels stay centred over their axis; side labels are
      // pushed outward so they clear the outer ring instead of straddling it.
      anchor: outer.x > CENTRE + 1 ? 'start' : outer.x < CENTRE - 1 ? 'end' : 'middle',
    }
  }),
)

const polygon = computed(() =>
  props.result.categories
    .map((category, index) => {
      const p = point(index, props.result.categories.length, category.score ?? 1)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    })
    .join(' '),
)

const rings = [2, 3, 4, 5]

function ringPolygon(level: number) {
  return props.result.categories
    .map((_, index) => {
      const p = point(index, props.result.categories.length, level)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    })
    .join(' ')
}
</script>

<template>
  <svg :viewBox="viewBox" class="w-full" aria-hidden="true" focusable="false">
    <polygon
      v-for="ring in rings"
      :key="ring"
      :points="ringPolygon(ring)"
      fill="none"
      stroke="currentColor"
      class="text-ink/10"
    />
    <line
      v-for="axis in axes"
      :key="axis.id"
      :x1="CENTRE"
      :y1="CENTRE"
      :x2="axis.outer.x"
      :y2="axis.outer.y"
      stroke="currentColor"
      class="text-ink/10"
    />
    <polygon
      :points="polygon"
      class="fill-blue/15 stroke-blue"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <text
      v-for="axis in axes"
      :key="`${axis.id}-label`"
      :x="axis.labelX"
      :y="axis.labelY"
      :text-anchor="axis.anchor"
      dominant-baseline="middle"
      class="fill-ink-muted text-[11px] tracking-[0.08em] uppercase"
    >
      {{ axis.label }}
    </text>
  </svg>
</template>
