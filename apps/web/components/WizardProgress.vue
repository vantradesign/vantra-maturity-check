<script setup lang="ts">
/**
 * The Airbnb-style step rail: a thin bar per step, filled by how much of that
 * step is answered.
 *
 * [UX] Four segments instead of one 24-question bar. Progress reads as "one of
 * four rooms done", which is what makes a long form feel finishable — and the
 * per-segment fill still shows that a step was left half-answered.
 */
const props = defineProps<{ currentIndex: number }>()

const catalog = useCatalog()
const t = useT()
const m = useMessages()
const { answeredIn } = useAssessment()

const segments = computed(() =>
  catalog.categories.map((category, index) => ({
    id: category.id,
    name: t(category.name),
    fill: answeredIn(category.id) / category.questions.length,
    isCurrent: index === props.currentIndex,
    isPast: index < props.currentIndex,
  })),
)
</script>

<template>
  <!-- Docks under the sticky header, so "where am I and how much is left" is
       answerable at any scroll position without going back to the top. -->
  <div
    class="sticky top-(--header-height) z-30 h-(--rail-height) gutter flex items-center border-b border-rule bg-paper/95 backdrop-blur"
  >
    <ol class="flex w-full gap-2" :aria-label="m('progressLabel')">
      <li v-for="segment in segments" :key="segment.id" class="flex-1">
        <NuxtLink
          :to="`/check/${segment.id}`"
          class="group block"
          :aria-current="segment.isCurrent ? 'step' : undefined"
        >
          <span class="block h-0.5 overflow-hidden bg-rule">
            <span
              class="block h-full bg-blue transition-[width] duration-500 ease-editorial"
              :style="{ width: `${Math.round(segment.fill * 100)}%` }"
            />
          </span>
          <span
            class="mt-2 block truncate text-caption transition-colors group-hover:text-ink"
            :class="segment.isCurrent ? 'text-ink' : 'text-ink-faint'"
          >
            {{ segment.name }}
          </span>
        </NuxtLink>
      </li>
    </ol>
  </div>
</template>
