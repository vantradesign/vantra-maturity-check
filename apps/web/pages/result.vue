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
  <div>
    <section class="gutter pt-16 md:pt-24">
      <p class="caption">{{ m('resultAnsweredCount', { answered, total }) }}</p>

      <!-- ── Loading state ──────────────────────────────────────────── -->
      <p v-if="!ready" class="mt-8 text-ink-muted">{{ m('resultLoading') }}</p>

      <!-- ── Shared-view banner ─────────────────────────────────────── -->
      <div
        v-if="ready && isSharedView"
        role="status"
        class="panel mt-8 px-6 py-5"
      >
        <p class="font-display text-title font-bold">{{ m('sharedViewTitle') }}</p>
        <p class="mt-2 measure text-ink-muted">{{ m('sharedViewBody') }}</p>
        <p
          v-if="droppedFromLink === 1"
          class="mt-2 text-ink-faint"
        >
          {{ m('resultDroppedOne') }}
        </p>
        <p
          v-else-if="droppedFromLink > 1"
          class="mt-2 text-ink-faint"
        >
          {{ m('resultDropped', { count: droppedFromLink }) }}
        </p>
        <div class="mt-4 flex flex-wrap gap-4">
          <button type="button" class="btn btn-solid" @click="leaveSharedView">
            {{ m('sharedViewSeeMine') }}
          </button>
          <button type="button" class="btn btn-quiet" @click="startMyOwnCheck">
            {{ m('sharedViewStartOwn') }}
          </button>
        </div>
      </div>

      <!-- ── Empty state ────────────────────────────────────────────── -->
      <template v-if="ready && answered === 0 && !isSharedView">
        <h1 class="mt-8 font-display text-display max-w-[26ch] text-balance">
          {{ m('resultEmptyTitle') }}
        </h1>
        <p class="mt-6 text-lead measure text-ink-muted">{{ m('resultEmptyBody') }}</p>
        <NuxtLink :to="`/check/${catalog.categories[0]!.id}`" class="btn btn-solid mt-8">
          {{ m('introStart') }}
        </NuxtLink>
      </template>

      <!-- ── Result view ─────────────────────────────────────────────── -->
      <template v-else-if="ready && answered > 0">
        <h1 class="mt-8 font-display text-display max-w-[26ch] text-balance">
          <template v-if="level">
            {{ m('resultLevelHeading', { level: result.overall.level ?? '—', name: t(level.name) }) }}
          </template>
        </h1>

        <p class="mt-4 text-ink-muted tabular-nums">
          {{ result.overall.score?.toFixed(2) ?? '—' }}
          <span class="text-ink-faint">/ 5.00</span>
        </p>

        <p v-if="level" class="mt-4 measure text-lead text-ink-muted">{{ t(level.summary) }}</p>

        <p
          v-if="!isComplete"
          class="mt-2 text-ink-faint"
        >
          {{ m('resultPartial') }}
        </p>

        <!-- ── Radar + table ───────────────────────────────────────── -->
        <div class="mt-16 md:grid md:grid-cols-12 md:gap-x-8">
          <div class="md:col-span-5">
            <ScoreRadar :result="result" :labels="labels" />
          </div>
          <div class="md:col-span-7 mt-8 md:mt-0">
            <ScoreTable :result="result" :labels="labels" />
          </div>
        </div>

        <!-- ── Next steps ──────────────────────────────────────────── -->
        <section class="mt-section border-t border-ink pt-8">
          <h2 class="caption">{{ m('resultNextTitle') }}</h2>
          <p class="mt-4 measure text-ink-muted">
            {{ m('resultNextLead', { marker: m('resultStartHere').toLowerCase() }) }}
          </p>

          <div class="mt-12 grid gap-14 md:grid-cols-2">
            <div v-for="entry in plan" :key="entry.id">
              <h3 class="font-display text-title font-bold">
                {{ entry.name }}
                <span v-if="entry.isPriority" class="ml-2 text-blue">
                  ← {{ m('resultStartHere') }}
                </span>
              </h3>
              <ol class="mt-5 space-y-4">
                <li
                  v-for="(ns, i) in entry.steps"
                  :key="ns.id"
                  class="border-l-2 border-rule pl-5"
                  :class="{ 'border-blue': i === 0 && entry.isPriority }"
                >
                  <p class="font-display font-bold">{{ t(ns.title) }}</p>
                  <p class="mt-1 measure text-ink-muted">{{ t(ns.detail) }}</p>
                  <p class="mt-1 text-caption normal-case tracking-normal text-ink-faint">
                    {{ effortLabel[ns.effort] }}
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <!-- ── Export & share ──────────────────────────────────────── -->
        <section class="mt-section border-t border-ink pt-8">
          <h2 class="caption">{{ m('resultExportTitle') }}</h2>
          <p class="mt-4 measure text-ink-muted">{{ m('resultExportLead') }}</p>

          <div class="mt-8 flex flex-wrap gap-4">
            <button type="button" class="btn btn-quiet" @click="downloadMarkdown">
              {{ m('resultDownloadMarkdown') }}
            </button>
            <button type="button" class="btn btn-quiet" @click="downloadJson">
              {{ m('resultDownloadJson') }}
            </button>
            <button type="button" class="btn btn-solid" @click="copyShareLink">
              {{ copied ? m('resultLinkCopied') : m('resultCopyLink') }}
            </button>
          </div>
          <p
            v-if="copied || copyFailed"
            role="status"
            class="mt-3 text-ink-muted"
            :class="{ 'text-fail': copyFailed }"
          >
            {{ copyFailed ? m('resultCopyFailed') : m('resultShareNote') }}
          </p>
        </section>

        <!-- ── Caveat ──────────────────────────────────────────────── -->
        <section class="mt-section border-t border-rule pt-8">
          <h2 class="caption">{{ m('resultCaveatTitle') }}</h2>
          <p class="mt-4 measure text-ink-muted">{{ m('resultCaveatBody') }}</p>
        </section>

        <!-- ── Delete ──────────────────────────────────────────────── -->
        <section v-if="!isSharedView" class="mt-section border-t border-rule pt-8 pb-16">
          <button
            v-if="!confirmingDelete && !deleted"
            type="button"
            class="text-caption normal-case tracking-normal text-ink-muted underline decoration-rule hover:text-ink"
            @click="confirmingDelete = true"
          >
            {{ m('resultDelete') }}
          </button>

          <div v-if="confirmingDelete" class="panel max-w-lg px-6 py-5">
            <p class="font-display font-bold">{{ m('resultDeleteConfirmQuestion') }}</p>
            <p class="mt-2 text-ink-muted">{{ m('resultDeleteExportFirst') }}</p>
            <div class="mt-4 flex flex-wrap gap-4">
              <button type="button" class="btn btn-quiet" @click="confirmingDelete = false">
                {{ m('resultDeleteCancel') }}
              </button>
              <button type="button" class="btn btn-solid" @click="confirmDelete">
                {{ m('resultDeleteConfirmYes') }}
              </button>
            </div>
          </div>

          <p v-if="deleted" role="status" class="text-ink-muted">
            {{ m('resultDeleted') }}
          </p>
        </section>
      </template>
    </section>
  </div>
</template>
