<script setup lang="ts">
import { findLevel, type AssessmentResult } from '@vantra-design/maturity-core'

/**
 * The numbers behind the radar. [A11y] This is the accessible version of the
 * chart, not a supplement to it: a real table, readable in any order.
 */
defineProps<{ result: AssessmentResult; labels: Record<string, string> }>()

const catalog = useCatalog()
const t = useT()
const m = useMessages()

function levelName(level: number | null) {
  const entry = findLevel(catalog, level as never)
  return entry ? t(entry.name) : m('tableNotAnswered')
}

function barWidth(score: number | null) {
  if (score === null) return 0
  return Math.round(((score - 1) / 4) * 100)
}
</script>

<template>
  <div
    class="overflow-x-auto"
    tabindex="0"
    role="region"
    :aria-label="m('tableCaption')"
  >
    <table class="w-full border-collapse text-left">
      <caption class="caption mb-4 text-left normal-case tracking-normal">
        {{ m('tableCaption') }}
      </caption>
      <thead>
        <tr class="border-y border-ink">
          <th scope="col" class="caption py-3 pr-6 align-bottom text-ink">{{ m('tableDimension') }}</th>
          <th scope="col" class="caption py-3 pr-6 align-bottom text-ink">{{ m('tableScore') }}</th>
          <th scope="col" class="caption py-3 pr-6 align-bottom text-ink">{{ m('tableLevel') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="category in result.categories"
          :key="category.categoryId"
          class="border-b border-rule"
        >
          <th scope="row" class="py-4 pr-6 align-top font-normal">
            {{ labels[category.categoryId] ?? category.categoryId }}
          </th>
          <td class="py-4 pr-6 align-top tabular-nums">
            <template v-if="category.score !== null">
              <span>{{ category.score.toFixed(2) }}</span>
              <div class="mt-1.5 h-1.5 w-20 bg-rule">
                <div
                  class="h-full bg-blue transition-[width] duration-500 ease-editorial"
                  :style="{ width: `${barWidth(category.score)}%` }"
                />
              </div>
            </template>
            <span v-else class="text-ink-muted">{{ m('tableNotAnswered') }}</span>
          </td>
          <td class="py-4 pr-6 align-top text-ink-muted">
            {{ levelName(category.level) }}
            <template v-if="category.answered < category.total">
              <span class="block text-caption normal-case tracking-normal text-ink-faint">
                {{ m('tableAnsweredOf', { answered: category.answered, total: category.total }) }}
              </span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
