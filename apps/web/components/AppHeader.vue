<script setup lang="ts">
import type { Locale } from '@vantra-design/maturity-core'

const locale = useLocale()
const m = useMessages()
const options: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
]
</script>

<template>
  <header class="sticky top-0 z-40 bg-paper border-b border-rule">
    <div class="gutter flex items-end justify-between py-2">
      <NuxtLink to="/" class="block" aria-label="Vantra Maturity Check — home">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 149.61 39.73" class="h-10" fill="currentColor" aria-hidden="true">
          <path d="M0,12.65h2.08l9.05,24.99,8.79-24.99h1.97l-9.58,27.08h-2.5L0,12.65Z"/>
          <path d="M31.44,12.65h2.8l9.73,27.08h-2.12l-2.99-8.29h-12.19l-2.95,8.29h-2.01l9.73-27.08ZM27.27,29.73h10.98l-5.49-15.34-5.49,15.34Z"/>
          <path d="M48.42,12.65h2.88l15.15,24.16V12.65h2.01v27.08h-2.5l-15.49-24.73v24.73h-2.04V12.65Z"/>
          <path d="M81.26,14.4h-8.41v-1.74h18.9v1.74h-8.41v25.34h-2.08V14.4Z"/>
          <path d="M96.12,12.65h7.42c5.26,0,9.2,2.04,9.2,7.27v.15c0,4.51-2.95,6.59-7.01,7.16l8.6,12.5h-2.35l-8.48-12.35h-5.26v12.35h-2.12V12.65ZM103.66,25.68c4.35,0,6.97-1.67,6.97-5.6v-.15c0-4.17-2.76-5.53-6.97-5.53h-5.42v11.29h5.42Z"/>
          <path d="M127.51,12.65h2.8l9.73,27.08h-2.12l-2.99-8.29h-12.19l-2.95,8.29h-2.01l9.73-27.08ZM123.35,29.73h10.98l-5.49-15.34-5.49,15.34Z"/>
          <polygon points="149.61 8.05 142.52 15.14 142.04 7.57 134.47 7.1 141.57 0 149.14 .47 149.61 8.05" fill="#021f94"/>
        </svg>
      </NuxtLink>

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
    </div>
  </header>
</template>
