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
  <div>
    <!-- ── Hero ────────────────────────────────────────────────────────── -->
    <section class="gutter pt-20 md:pt-28">
      <div class="md:grid md:grid-cols-12 md:gap-x-8">
        <div class="md:col-span-8">
          <p class="caption">{{ m('introMeta', { count: total }) }}</p>
          <h1 class="mt-4 font-display text-display max-w-[20ch] text-balance font-bold">
            {{ m('introTitle') }}
          </h1>
        </div>
      </div>

      <div class="mt-8 md:grid md:grid-cols-12 md:gap-x-8">
        <div class="md:col-span-6 md:col-start-5">
          <p class="text-lead measure text-ink-muted">{{ m('introLead') }}</p>

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
        </div>
      </div>
    </section>

    <!-- ── Category overview ───────────────────────────────────────────── -->
    <section class="gutter mt-section">
      <div class="md:grid md:grid-cols-12 md:gap-x-8">
        <div class="md:col-span-12">
          <ol class="grid gap-px border border-rule bg-rule sm:grid-cols-2">
            <li v-for="(category, index) in catalog.categories" :key="category.id" class="bg-paper p-6">
              <p class="caption">{{ m('introStepLabel', { number: index + 1 }) }}</p>
              <h2 class="mt-2 font-display text-title font-bold">{{ t(category.name) }}</h2>
              <p class="measure mt-2 text-ink-muted">{{ t(category.description) }}</p>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- ── Honesty block ───────────────────────────────────────────────── -->
    <section class="gutter mt-section border-t border-ink pt-8">
      <div class="md:grid md:grid-cols-12 md:gap-x-8">
        <div class="md:col-span-6 md:col-start-5">
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
        </div>
      </div>
    </section>
  </div>
</template>
