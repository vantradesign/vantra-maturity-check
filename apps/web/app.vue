<script setup lang="ts">
const { locale, restore, persist, answers } = useAssessment()
const m = useMessages()

onMounted(restore)
watch([answers, locale], persist, { deep: true })

useHead(() => ({ htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
    >
      {{ m('skipToContent') }}
    </a>
    <AppHeader />
    <main id="main" class="flex-1">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>
