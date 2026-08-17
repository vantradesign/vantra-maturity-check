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
  <div v-if="category && step">
    <WizardProgress :current-index="step.index" />

    <section class="gutter py-10 md:py-14">
      <header class="mb-10 md:grid md:grid-cols-12 md:gap-x-8">
        <div class="md:col-span-8 md:col-start-5">
          <p class="caption">
            {{ m('stepOf', { number: step.number, total: step.of }) }}
          </p>
          <h1 class="mt-3 font-display text-display max-w-[20ch] text-balance">
            {{ t(category.name) }}
          </h1>
          <p class="mt-4 measure text-ink-muted">{{ t(category.description) }}</p>
          <p class="mt-2 text-ink-faint">{{ m('stepSkipNote') }}</p>
        </div>
      </header>

      <div class="md:grid md:grid-cols-12 md:gap-x-8">
        <div class="md:col-span-8 md:col-start-5 space-y-10">
          <QuestionBlock
            v-for="(question, index) in category.questions"
            :key="question.id"
            :question="question"
            :index="firstQuestionNumber + index"
          />
        </div>
      </div>

      <nav class="mt-14 md:grid md:grid-cols-12 md:gap-x-8">
        <div class="md:col-span-8 md:col-start-5 flex flex-wrap items-center gap-4">
          <NuxtLink
            :to="backTo"
            class="btn btn-quiet"
          >
            {{ m('stepBack') }}
          </NuxtLink>

          <button type="button" class="btn btn-solid" @click="goNext">
            {{
              step.next
                ? m('stepNext')
                : allAnsweredHere
                  ? m('stepSeeResult')
                  : m('stepSkipToResult')
            }}
          </button>

          <span class="ml-auto text-caption normal-case tracking-normal text-ink-faint tabular-nums">
            {{ m('stepAnswered', { answered: answeredHere, total: questionCount }) }}
          </span>
        </div>
      </nav>
    </section>
  </div>
</template>
