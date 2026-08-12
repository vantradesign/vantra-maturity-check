<script setup lang="ts">
import type { Question } from '@vantra/maturity-core'

/**
 * One question as a radio group of full-width option cards.
 *
 * [A11y] A real `fieldset`/`legend` with real `input[type=radio]`s. The cards
 * are styled labels, so arrow-key navigation, screen-reader grouping and form
 * semantics come from the platform instead of being reimplemented with ARIA.
 */
const props = defineProps<{ question: Question; index: number }>()

const t = useT()
const m = useMessages()
const catalog = useCatalog()
const { answers, select, setNote } = useAssessment()

const selectedId = computed(() => answers.value[props.question.id]?.optionId ?? null)
const note = computed(() => answers.value[props.question.id]?.note ?? '')

const showNote = ref(false)
const showWhy = ref(false)

/** Resolve the question's citations against the catalog bibliography. */
const sources = computed(() =>
  (props.question.sources ?? []).flatMap((reference) => {
    const source = catalog.sources?.find((entry) => entry.id === reference.ref)
    return source ? [{ ...source, criterion: reference.criterion }] : []
  }),
)
</script>

<template>
  <fieldset class="border-t border-rule pt-8">
    <legend class="sr-only">{{ t(question.prompt) }}</legend>

    <p class="caption mb-3">{{ m('questionNumber', { number: index }) }}</p>
    <p class="measure font-display text-title font-bold" aria-hidden="true">
      {{ t(question.prompt) }}
    </p>
    <p class="measure mt-3 text-ink-muted">{{ t(question.help) }}</p>

    <div class="mt-6 grid gap-2">
      <label
        v-for="option in question.options"
        :key="option.id"
        class="panel flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-[border-color,box-shadow] duration-200 ease-editorial hover:border-ink/30 has-[:checked]:border-blue has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-blue)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue"
      >
        <input
          type="radio"
          :name="question.id"
          :value="option.id"
          :checked="selectedId === option.id"
          class="mt-1.5 size-4 shrink-0 accent-blue"
          @change="select(question.id, option.id)"
        />
        <span>{{ t(option.label) }}</span>
      </label>
    </div>

    <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
      <button
        v-if="question.allowNote"
        type="button"
        class="text-caption normal-case tracking-normal text-ink-muted underline decoration-rule hover:text-ink"
        :aria-expanded="showNote"
        @click="showNote = !showNote"
      >
        {{ showNote ? m('questionHideNote') : note ? m('questionEditNote') : m('questionAddNote') }}
      </button>
      <button
        v-if="sources.length > 0"
        type="button"
        class="text-caption normal-case tracking-normal text-ink-muted underline decoration-rule hover:text-ink"
        :aria-expanded="showWhy"
        @click="showWhy = !showWhy"
      >
        {{ m('questionSources') }}
      </button>
    </div>

    <div v-if="showNote && question.allowNote" class="mt-3">
      <label class="caption block" :for="`note-${question.id}`">
        {{ m('questionNoteLabel') }}
      </label>
      <textarea
        :id="`note-${question.id}`"
        :value="note"
        rows="3"
        class="panel mt-2 block w-full px-3 py-2"
        @input="setNote(question.id, ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <!-- The provenance from the catalog, surfaced where the disagreement
         happens: at the question, not in a footnote nobody opens. -->
    <ul
      v-if="showWhy"
      class="measure mt-3 grid gap-1 text-caption normal-case tracking-normal text-ink-muted"
    >
      <li v-for="source in sources" :key="source.id">
        <a v-if="source.url" :href="source.url" class="underline decoration-rule hover:text-ink">
          {{ source.name }}
        </a>
        <span v-else>{{ source.name }}</span>
        <span class="text-ink-faint"> · {{ source.publisher }}</span>
        <span v-if="source.criterion"> — {{ source.criterion }}</span>
      </li>
    </ul>
  </fieldset>
</template>
