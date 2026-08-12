<script setup lang="ts">
const catalog = useCatalog()
const t = useT()
const m = useMessages()
const { answered, total, isComplete } = useAssessment()

const steps = useSteps()
const firstStep = computed(() => `/check/${steps[0]!.id}`)

/** Only meaningful after hydration; the prerendered HTML shows the clean start. */
const hasProgress = computed(() => answered.value > 0)

useHead(() => ({ title: `${m('introTitle')} — Vantra Maturity Check` }))
</script>

<template>
  <div class="gutter py-section">
    <p class="caption">{{ m('introMeta', { count: total }) }}</p>

    <h1 class="measure mt-4 font-display text-display font-bold">{{ m('introTitle') }}</h1>

    <p class="measure mt-6 text-lead text-ink-muted">{{ m('introLead') }}</p>

    <div class="mt-10 flex flex-wrap items-center gap-4">
      <NuxtLink :to="firstStep" class="btn btn-solid">
        {{ hasProgress ? m('introContinue') : m('introStart') }}
      </NuxtLink>
      <NuxtLink v-if="isComplete" to="/result" class="btn btn-quiet">
        {{ m('introSeeResult') }}
      </NuxtLink>
      <p v-if="hasProgress" class="text-caption normal-case tracking-normal text-ink-muted">
        {{ m('introSaved', { answered, total }) }}
      </p>
    </div>

    <ol class="mt-section grid gap-px border border-rule bg-rule sm:grid-cols-2">
      <li v-for="(category, index) in catalog.categories" :key="category.id" class="bg-paper p-6">
        <p class="caption">{{ m('introStepLabel', { number: index + 1 }) }}</p>
        <h2 class="mt-2 font-display text-title font-bold">{{ t(category.name) }}</h2>
        <p class="measure mt-2 text-ink-muted">{{ t(category.description) }}</p>
      </li>
    </ol>

    <!-- [Product] The honesty block. Stated on the way in, not buried in a
         privacy page, because it is the reason a team will answer truthfully. -->
    <section class="mt-section measure">
      <h2 class="caption">{{ m('introHonestyTitle') }}</h2>
      <ul class="mt-4 grid gap-3 text-ink-muted">
        <li>
          <strong class="text-ink">{{ m('introHonestyPrivacyLead') }}</strong>
          {{ m('introHonestyPrivacy') }}
        </li>
        <li>
          <strong class="text-ink">{{ m('introHonestySourcedLead') }}</strong>
          {{ m('introHonestySourced') }}
        </li>
        <li>
          <strong class="text-ink">{{ m('introHonestyPracticeLead') }}</strong>
          {{ m('introHonestyPractice') }}
        </li>
      </ul>
    </section>
  </div>
</template>
