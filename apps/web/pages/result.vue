<script setup lang="ts">
import {
  decodeAnswers,
  encodeAnswers,
  findLevel,
  renderMarkdownReport,
  stepsFor,
  toJsonExport,
  weakestCategories,
} from '@vantra/maturity-core'

/**
 * [UX] The result is a description, not a verdict. Level first, then the shape
 * across dimensions, then what to do on Monday — and the caveats stay on the
 * page rather than hiding in a methodology link.
 */
const catalog = useCatalog()
const t = useT()
const m = useMessages()
const { answers, answered, total, isComplete, result, locale, reset } = useAssessment()

const route = useRoute()
const ready = ref(false)
const droppedFromLink = ref(0)

onMounted(() => {
  // A shared link wins over whatever is stored locally: the person opening it
  // asked to see someone else's result, not their own. Their own answers are
  // untouched in localStorage until they answer something.
  const encoded = route.query.a
  if (typeof encoded === 'string' && encoded !== '') {
    const decoded = decodeAnswers(catalog, encoded)
    if (decoded) {
      answers.value = decoded.answers
      droppedFromLink.value = decoded.dropped.length
    }
  }
  ready.value = true
})

const level = computed(() => findLevel(catalog, result.value.overall.level))
const labels = computed(() =>
  Object.fromEntries(catalog.categories.map((category) => [category.id, t(category.name)])),
)

const weakest = computed(() => weakestCategories(result.value, 2))

const plan = computed(() =>
  catalog.categories.map((category) => {
    const scored = result.value.categories.find((entry) => entry.categoryId === category.id)
    return {
      id: category.id,
      name: t(category.name),
      isPriority: weakest.value.includes(category.id),
      steps: stepsFor(catalog, category.id, scored?.level ?? null),
    }
  }),
)

const effortLabel = computed<Record<string, string>>(() => ({
  S: m('effortS'),
  M: m('effortM'),
  L: m('effortL'),
}))

function download(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

function downloadMarkdown() {
  const markdown = renderMarkdownReport(catalog, result.value, {
    locale: locale.value,
    answers: answers.value,
  })
  download(`maturity-check-${stamp()}.md`, markdown, 'text/markdown;charset=utf-8')
}

function downloadJson() {
  const payload = toJsonExport(result.value, answers.value, locale.value, catalog.version)
  download(
    `maturity-check-${stamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8',
  )
}

const copied = ref(false)
async function copyShareLink() {
  const link = `${window.location.origin}/result?a=${encodeAnswers(catalog, answers.value)}`
  await navigator.clipboard.writeText(link)
  copied.value = true
  setTimeout(() => (copied.value = false), 2500)
}

useHead(() => ({ title: `${m('resultNextTitle')} — Vantra Maturity Check` }))
</script>

<template>
  <div class="gutter py-section">
    <!-- Until hydration the page cannot know the answers; showing a level here
         would mean showing a wrong one for a frame. -->
    <p v-if="!ready" class="caption">{{ m('resultLoading') }}</p>

    <template v-else-if="answered === 0">
      <h1 class="measure font-display text-display font-bold">{{ m('resultEmptyTitle') }}</h1>
      <p class="measure mt-4 text-lead text-ink-muted">{{ m('resultEmptyBody') }}</p>
      <NuxtLink :to="`/check/${catalog.categories[0]!.id}`" class="btn btn-solid mt-8">
        {{ m('introStart') }}
      </NuxtLink>
    </template>

    <template v-else>
      <p class="caption">{{ m('resultAnsweredCount', { answered, total }) }}</p>

      <!-- A link made with an older catalog can reference questions that no
           longer exist. Silently dropping them would misstate the score. -->
      <p
        v-if="droppedFromLink > 0"
        class="measure panel mt-4 px-4 py-3 text-caption normal-case tracking-normal text-ink-muted"
      >
        {{
          droppedFromLink === 1
            ? m('resultDroppedOne')
            : m('resultDropped', { count: droppedFromLink })
        }}
      </p>

      <div class="mt-4 grid gap-12 lg:grid-cols-[1fr_minmax(24rem,32rem)] lg:items-center">
        <div>
          <h1 class="measure font-display text-display font-bold">
            {{
              m('resultLevelHeading', { level: result.overall.level ?? '—', name: t(level?.name) })
            }}
          </h1>
          <p class="measure mt-4 text-lead text-ink-muted">{{ t(level?.summary) }}</p>
          <p class="mt-6 font-display text-title font-bold tabular-nums">
            {{ result.overall.score?.toFixed(2) ?? '—' }}
            <span class="text-ink-faint">/ 5.00</span>
          </p>
          <p
            v-if="!isComplete"
            class="measure mt-4 text-caption normal-case tracking-normal text-ink-muted"
          >
            {{ m('resultPartial') }}
          </p>
        </div>

        <ScoreRadar :result="result" :labels="labels" />
      </div>

      <section class="mt-section">
        <ScoreTable :result="result" :labels="labels" />
      </section>

      <section class="mt-section">
        <h2 class="font-display text-title font-bold">{{ m('resultNextTitle') }}</h2>
        <p class="measure mt-3 text-ink-muted">
          {{ m('resultNextLead', { marker: m('resultStartHere').toLowerCase() }) }}
        </p>

        <div class="mt-8 grid gap-8 md:grid-cols-2">
          <article v-for="entry in plan" :key="entry.id" class="panel p-6">
            <header class="flex items-baseline justify-between gap-3">
              <h3 class="font-display text-lead font-bold">{{ entry.name }}</h3>
              <span v-if="entry.isPriority" class="caption text-blue">
                {{ m('resultStartHere') }}
              </span>
            </header>
            <ol class="mt-4 grid gap-4">
              <li v-for="step in entry.steps" :key="step.id">
                <p class="font-bold">{{ t(step.title) }}</p>
                <p class="mt-1 text-ink-muted">{{ t(step.detail) }}</p>
                <p class="caption mt-1">{{ effortLabel[step.effort] }}</p>
              </li>
            </ol>
          </article>
        </div>
      </section>

      <section class="mt-section">
        <h2 class="font-display text-title font-bold">{{ m('resultExportTitle') }}</h2>
        <p class="measure mt-3 text-ink-muted">{{ m('resultExportLead') }}</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <button type="button" class="btn btn-solid" @click="downloadMarkdown">
            {{ m('resultDownloadMarkdown') }}
          </button>
          <button type="button" class="btn btn-quiet" @click="downloadJson">
            {{ m('resultDownloadJson') }}
          </button>
          <button type="button" class="btn btn-quiet" @click="copyShareLink">
            {{ copied ? m('resultLinkCopied') : m('resultCopyLink') }}
          </button>
        </div>
        <p class="measure mt-3 text-caption normal-case tracking-normal text-ink-faint">
          {{ m('resultShareNote') }}
        </p>
      </section>

      <section class="mt-section measure">
        <h2 class="caption">{{ m('resultCaveatTitle') }}</h2>
        <p class="mt-4 text-ink-muted">{{ m('resultCaveatBody') }}</p>
        <button
          type="button"
          class="mt-6 text-caption normal-case tracking-normal underline decoration-rule hover:decoration-ink"
          @click="reset"
        >
          {{ m('resultDelete') }}
        </button>
      </section>
    </template>
  </div>
</template>
