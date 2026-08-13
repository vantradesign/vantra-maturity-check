<script setup lang="ts">
import {
  decodeAnswers,
  encodeAnswers,
  findLevel,
  renderMarkdownReport,
  stepsFor,
  toJsonExport,
  weakestCategories,
} from '@vantra-design/maturity-core'

/**
 * [UX] The result is a description, not a verdict. Level first, then the shape
 * across dimensions, then what to do on Monday — and the caveats stay on the
 * page rather than hiding in a methodology link.
 */
const catalog = useCatalog()
const t = useT()
const m = useMessages()
const { answers, answered, total, isComplete, result, locale, reset, restore, isSharedView } =
  useAssessment()

const route = useRoute()
const router = useRouter()
const ready = ref(false)
const droppedFromLink = ref(0)

/**
 * [Security] The payload lives in the fragment, never the query string. A
 * fragment is not sent to the origin, so it stays out of server and CDN access
 * logs and out of the `Referer` header. These answers are a candid internal
 * assessment; the transport should not quietly publish them.
 *
 * `?a=` is still accepted so links shared before this change keep working, and
 * is immediately rewritten to a fragment so it does not persist in history.
 */
function readSharedPayload(): string | null {
  const fromHash = route.hash.startsWith('#a=') ? route.hash.slice(3) : ''
  if (fromHash !== '') return decodeURIComponent(fromHash)

  const legacy = route.query.a
  return typeof legacy === 'string' && legacy !== '' ? legacy : null
}

onMounted(() => {
  // A shared link wins over whatever is stored locally: the person opening it
  // asked to see someone else's result. Their own answers stay in localStorage —
  // `isSharedView` stops `persist()` from overwriting them.
  const encoded = readSharedPayload()
  if (encoded) {
    const decoded = decodeAnswers(catalog, encoded)
    if (decoded) {
      isSharedView.value = true
      answers.value = decoded.answers
      droppedFromLink.value = decoded.dropped.length

      if (typeof route.query.a === 'string') {
        router.replace({ path: route.path, query: {}, hash: `#a=${encoded}` })
      }
    }
  }
  ready.value = true
})

/**
 * Leave the shared result and go back to whatever this device has stored.
 *
 * Both banner actions route through here: entering the wizard while still in
 * shared view would show borrowed answers and refuse to save them.
 */
function leaveSharedView() {
  isSharedView.value = false
  answers.value = {}
  droppedFromLink.value = 0
  router.replace({ path: route.path, query: {}, hash: '' })
  restore()
}

function startMyOwnCheck() {
  leaveSharedView()
  router.push(`/check/${catalog.categories[0]!.id}`)
}

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
const copyFailed = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

/**
 * [UX] The clipboard can refuse: an insecure origin, a denied permission, or a
 * browser that never implemented the API. Letting the rejection go unhandled
 * leaves the button unchanged and the person guessing, so failure is stated and
 * a manual route is offered.
 */
async function copyShareLink() {
  const link = `${window.location.origin}/result#a=${encodeAnswers(catalog, answers.value)}`

  clearTimeout(copyTimer)
  copied.value = false
  copyFailed.value = false

  try {
    await navigator.clipboard.writeText(link)
    copied.value = true
  } catch {
    copyFailed.value = true
  }

  copyTimer = setTimeout(() => {
    copied.value = false
    copyFailed.value = false
  }, 6000)
}

onBeforeUnmount(() => clearTimeout(copyTimer))

/**
 * [UX] Deleting twenty-four answers is irreversible and the control sits under a
 * paragraph people are meant to read, so it asks first.
 */
const confirmingDelete = ref(false)
const deleted = ref(false)

function confirmDelete() {
  reset()
  confirmingDelete.value = false
  deleted.value = true
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
      <!-- [UX] Above the score on purpose: by the time someone has read a level
           and a number, they have already decided whose result it is. -->
      <aside
        v-if="isSharedView"
        class="measure panel mb-8 border-l-2 border-l-blue px-4 py-4"
        aria-labelledby="shared-view-title"
      >
        <h2 id="shared-view-title" class="caption text-ink">{{ m('sharedViewTitle') }}</h2>
        <p class="mt-2 text-caption normal-case tracking-normal text-ink-muted">
          {{ m('sharedViewBody') }}
        </p>
        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <button
            type="button"
            class="text-caption normal-case tracking-normal underline decoration-rule hover:decoration-ink"
            @click="leaveSharedView"
          >
            {{ m('sharedViewSeeMine') }}
          </button>
          <button
            type="button"
            class="text-caption normal-case tracking-normal underline decoration-rule hover:decoration-ink"
            @click="startMyOwnCheck"
          >
            {{ m('sharedViewStartOwn') }}
          </button>
        </div>
      </aside>

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
            {{ m('resultCopyLink') }}
          </button>
        </div>
        <!-- [A11y] role=status so the outcome of pressing Copy is announced, not
             only shown. Failure is the case that actually needs saying. -->
        <p
          v-if="copied || copyFailed"
          role="status"
          class="measure mt-3 text-caption normal-case tracking-normal"
          :class="copyFailed ? 'text-fail' : 'text-ink-muted'"
        >
          {{ copyFailed ? m('resultCopyFailed') : m('resultLinkCopied') }}
        </p>

        <p class="measure mt-3 text-caption normal-case tracking-normal text-ink-faint">
          {{ m('resultShareNote') }}
        </p>
      </section>

      <section class="mt-section measure">
        <h2 class="caption">{{ m('resultCaveatTitle') }}</h2>
        <p class="mt-4 text-ink-muted">{{ m('resultCaveatBody') }}</p>
        <!-- [UX] Twenty-four answers, one click, no undo. It asks first. -->
        <p
          v-if="deleted"
          role="status"
          class="mt-6 text-caption normal-case tracking-normal text-ink-muted"
        >
          {{ m('resultDeleted') }}
        </p>

        <button
          v-else-if="!confirmingDelete"
          type="button"
          class="mt-6 text-caption normal-case tracking-normal underline decoration-rule hover:decoration-ink"
          @click="confirmingDelete = true"
        >
          {{ m('resultDelete') }}
        </button>

        <div v-else class="panel mt-6 px-4 py-4">
          <p class="text-caption normal-case tracking-normal text-ink">
            {{ m('resultDeleteConfirmQuestion') }}
          </p>
          <p class="mt-2 text-caption normal-case tracking-normal text-ink-faint">
            {{ m('resultDeleteExportFirst') }}
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <button type="button" class="btn btn-quiet" @click="confirmingDelete = false">
              {{ m('resultDeleteCancel') }}
            </button>
            <button type="button" class="btn btn-solid" @click="confirmDelete">
              {{ m('resultDeleteConfirmYes') }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
