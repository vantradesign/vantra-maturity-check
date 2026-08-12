<script setup lang="ts">
const catalog = useCatalog()
const m = useMessages()
const repo = 'https://github.com/vantradesign/vantra-maturity-check'
</script>

<template>
  <footer class="gutter border-t border-rule py-8">
    <div class="flex flex-wrap items-baseline justify-between gap-4 text-caption">
      <p class="normal-case tracking-normal">
        {{ m('footerPrivacy') }}
        <span class="text-ink-faint">{{ m('footerCatalog', { version: catalog.version }) }}</span>
      </p>
      <nav class="flex gap-4">
        <a
          class="underline decoration-rule hover:decoration-ink"
          :href="`${repo}/blob/main/docs/METHODOLOGY.md`"
        >
          {{ m('footerMethodology') }}
        </a>
        <a class="underline decoration-rule hover:decoration-ink" :href="repo">
          {{ m('footerSource') }}
        </a>
      </nav>
    </div>
  </footer>
</template>
