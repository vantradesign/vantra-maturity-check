<script setup lang="ts">
import type { Locale } from '@vantra/maturity-core'

const locale = useLocale()
const m = useMessages()
const options: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
]
</script>

<template>
  <!-- Sticky: the wordmark and the language switch stay reachable through a
       long form, and the step rail docks directly underneath it. -->
  <header
    class="sticky top-0 z-40 h-(--header-height) gutter flex items-center justify-between border-b border-rule bg-paper/95 backdrop-blur"
  >
    <NuxtLink to="/" class="font-display text-[1.375rem] leading-none tracking-[-0.02em]">
      Vantra <span class="text-ink-muted">Maturity Check</span>
    </NuxtLink>

    <!-- [A11y] A two-item radio group rather than a select: both states stay
         visible, and the current language is announced without opening a menu. -->
    <fieldset class="flex items-center gap-1">
      <legend class="sr-only">{{ m('language') }}</legend>
      <label
        v-for="option in options"
        :key="option.value"
        class="cursor-pointer border border-transparent px-2 py-1 text-caption transition-colors duration-200 ease-editorial hover:border-rule has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue"
      >
        <input v-model="locale" type="radio" name="locale" :value="option.value" class="sr-only" />
        {{ option.label }}
      </label>
    </fieldset>
  </header>
</template>
