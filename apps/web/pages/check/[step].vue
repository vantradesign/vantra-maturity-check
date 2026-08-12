<script setup lang="ts">
/**
 * One category per screen, with wizard chrome.
 *
 * [UX] A category is the unit that makes sense to a team: six related questions
 * visible at once, so a workshop can see the shape of a dimension, argue, and
 * jump back. Twenty-four separate screens would be a longer, lonelier form.
 */
const route = useRoute()
const router = useRouter()
const catalog = useCatalog()
const t = useT()
const m = useMessages()
const { answeredIn } = useAssessment()
const steps = useSteps()

const stepId = computed(() => String(route.params.step))
const step = computed(() => steps.find((entry) => entry.id === stepId.value))
const category = computed(() => catalog.categories.find((entry) => entry.id === stepId.value))

// Prerendered routes are generated from the catalog, so this only triggers for a
// hand-edited or stale URL.
if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Unknown step', fatal: true })
}

const answeredHere = computed(() => answeredIn(stepId.value))
const questionCount = computed(() => category.value?.questions.length ?? 0)
const allAnsweredHere = computed(() => answeredHere.value === questionCount.value)

const nextTo = computed(() => (step.value?.next ? `/check/${step.value.next}` : '/result'))
const backTo = computed(() => (step.value?.previous ? `/check/${step.value.previous}` : '/'))

/** Number questions continuously across steps: "Question 13", not "1 of 6" four times. */
const firstQuestionNumber = computed(() => {
  const index = step.value?.index ?? 0
  return catalog.categories.slice(0, index).reduce((sum, c) => sum + c.questions.length, 0) + 1
})

function goNext() {
  router.push(nextTo.value)
}

useHead(() => ({
  title: `${t(category.value?.name)} — Vantra Maturity Check`,
}))
</script>

<template>
  <div v-if="category && step" class="pb-40">
    <WizardProgress :current-index="step.index" />

    <div class="gutter">
      <header class="pt-12">
        <p class="caption">{{ m('stepOf', { number: step.number, total: step.of }) }}</p>
        <h1 class="measure mt-3 font-display text-display font-bold">{{ t(category.name) }}</h1>
        <p class="measure mt-4 text-lead text-ink-muted">{{ t(category.description) }}</p>
        <p class="mt-4 text-caption normal-case tracking-normal text-ink-faint">
          {{ m('stepSkipNote') }}
        </p>
      </header>

      <div class="mt-12 grid gap-12">
        <QuestionBlock
          v-for="(question, index) in category.questions"
          :key="question.id"
          :question="question"
          :index="firstQuestionNumber + index"
        />
      </div>
    </div>

    <!-- Fixed action bar: the primary action stays one reach away on a phone,
         mirroring the sticky header and rail at the other end of the screen. -->
    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 backdrop-blur">
      <div class="gutter flex items-center justify-between gap-4 py-4">
        <NuxtLink
          :to="backTo"
          class="btn btn-quiet border-transparent underline decoration-rule hover:border-transparent hover:decoration-ink"
        >
          {{ m('stepBack') }}
        </NuxtLink>

        <div class="flex items-center gap-4">
          <p class="text-caption normal-case tracking-normal text-ink-muted">
            {{ m('stepAnswered', { answered: answeredHere, total: questionCount }) }}
          </p>
          <button type="button" class="btn btn-solid" @click="goNext">
            {{
              step.next
                ? m('stepNext')
                : allAnsweredHere
                  ? m('stepSeeResult')
                  : m('stepSkipToResult')
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
