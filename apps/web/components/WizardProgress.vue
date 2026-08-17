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
    index,
    id: category.id,
    name: t(category.name),
    fill: answeredIn(category.id) / category.questions.length,
    isCurrent: index === props.currentIndex,
    isPast: index < props.currentIndex,
  })),
)
</script>

<template>
  <nav
    :aria-label="m('progressLabel')"
    class="sticky top-(--header-height) z-30 flex h-(--rail-height) border-b border-rule bg-paper"
  >
    <NuxtLink
      v-for="segment in segments"
      :key="segment.id"
      :to="`/check/${segment.id}`"
      class="group relative flex flex-1 items-center justify-center overflow-hidden border-r border-rule transition-colors duration-200 ease-editorial last:border-r-0"
      :class="segment.isCurrent ? 'bg-white' : 'hover:bg-white/50'"
      :aria-current="segment.isCurrent ? 'step' : undefined"
    >
      <span class="relative z-10 text-caption normal-case tracking-normal">
        <span class="hidden sm:inline">{{ segment.name }}</span>
        <span class="sm:hidden">{{ segment.index + 1 }}</span>
      </span>
      <span
        class="absolute inset-y-0 left-0 bg-blue/10 transition-[width] duration-300 ease-editorial"
        :style="{ width: `${Math.round(segment.fill * 100)}%` }"
      />
    </NuxtLink>
  </nav>
</template>
