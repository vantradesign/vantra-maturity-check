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
  <table class="w-full border-collapse text-left">
    <caption class="caption pb-3 text-left">
      {{
        m('tableCaption')
      }}
    </caption>
    <thead>
      <tr class="border-b border-rule text-caption">
        <th scope="col" class="py-2 font-normal">{{ m('tableDimension') }}</th>
        <th scope="col" class="py-2 font-normal">{{ m('tableScore') }}</th>
        <th scope="col" class="py-2 font-normal">{{ m('tableLevel') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="category in result.categories"
        :key="category.categoryId"
        class="border-b border-rule"
      >
        <th scope="row" class="py-3 pr-4 font-normal">
          {{ labels[category.categoryId] ?? category.categoryId }}
          <span
            v-if="category.answered < category.total"
            class="block text-caption normal-case tracking-normal text-ink-faint"
          >
            {{ m('tableAnsweredOf', { answered: category.answered, total: category.total }) }}
          </span>
        </th>
        <td class="py-3 pr-4 align-middle">
          <span class="flex items-center gap-3">
            <span class="h-0.5 w-24 overflow-hidden bg-rule" aria-hidden="true">
              <span
                class="block h-full bg-blue"
                :style="{ width: `${barWidth(category.score)}%` }"
              />
            </span>
            <span class="tabular-nums">{{ category.score?.toFixed(2) ?? '—' }}</span>
          </span>
        </td>
        <td class="py-3 text-ink-muted">{{ levelName(category.level) }}</td>
      </tr>
    </tbody>
  </table>
</template>
