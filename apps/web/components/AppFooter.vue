<script setup lang="ts">
const catalog = useCatalog()
const m = useMessages()
const year = new Date().getFullYear()
const repo = 'https://github.com/vantradesign/vantra-maturity-check'
</script>

<template>
  <footer class="gutter border-t border-rule mt-section">
    <div class="grid gap-12 py-16 md:grid-cols-12">
      <div class="md:col-span-5">
        <p class="font-display text-title measure-tight">
          {{ m('footerPrivacy') }}
        </p>
        <p class="mt-3 text-ink-faint">
          {{ m('footerCatalog', { version: catalog.version }) }}
        </p>
      </div>

      <div class="md:col-span-3 md:col-start-8">
        <h2 class="caption mb-4">{{ m('footerMethodology') }}</h2>
        <ul class="space-y-2">
          <li>
            <a
              :href="`${repo}/blob/main/docs/METHODOLOGY.md`"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-[0.3em] decoration-1 transition-[text-decoration-color] duration-300 ease-editorial decoration-ink/30 hover:decoration-ink"
            >
              {{ m('footerMethodology') }}<span aria-hidden="true" class="ml-1 inline-block">↗</span
              ><span class="sr-only">(opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a
              :href="repo"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-[0.3em] decoration-1 transition-[text-decoration-color] duration-300 ease-editorial decoration-ink/30 hover:decoration-ink"
            >
              {{ m('footerSource') }}<span aria-hidden="true" class="ml-1 inline-block">↗</span
              ><span class="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>

      <div class="md:col-span-2">
        <h2 class="caption mb-4">Vantra</h2>
        <ul class="space-y-2">
          <li>
            <a
              href="https://vantra.design"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-[0.3em] decoration-1 transition-[text-decoration-color] duration-300 ease-editorial decoration-ink/30 hover:decoration-ink"
            >
              vantra.design<span aria-hidden="true" class="ml-1 inline-block">↗</span
              ><span class="sr-only">(opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a
              href="https://github.com/vantradesign"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-[0.3em] decoration-1 transition-[text-decoration-color] duration-300 ease-editorial decoration-ink/30 hover:decoration-ink"
            >
              GitHub<span aria-hidden="true" class="ml-1 inline-block">↗</span
              ><span class="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <p class="caption pb-10">&copy; {{ year }} Vantra Design</p>
  </footer>
</template>
