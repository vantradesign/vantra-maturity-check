import tailwindcss from '@tailwindcss/vite'
import { designSystemCatalog } from '@vantra/maturity-core'

/**
 * The app is generated to static files and deployed to a CDN.
 *
 * [Engineering] `ssr: true` with `nuxt generate` means every route is
 * prerendered to real HTML: the intro and each wizard step are readable and
 * indexable before a single byte of JavaScript executes. Answers themselves
 * never touch a server — there is none — so the result route is prerendered as
 * a shell and filled in from local state on the client.
 */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,

  modules: ['@nuxt/fonts'],

  css: ['~/assets/css/main.css'],

  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'A 24-question self-assessment that scores design-system maturity across documentation, versioning, governance and adoption. Runs entirely in your browser.',
        },
      ],
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/result', ...designSystemCatalog.categories.map((c) => `/check/${c.id}`)],
    },
  },

  fonts: {
    experimental: {
      // Required with Tailwind v4: the families are only ever named inside
      // @theme custom properties, which the scanner would otherwise not see.
      processCSSVariables: true,
    },
    defaults: { weights: [400, 700], styles: ['normal'], subsets: ['latin'] },
    families: [{ name: 'Bricolage Grotesque' }, { name: 'Inclusive Sans' }],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
  },
})
