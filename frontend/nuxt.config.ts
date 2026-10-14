// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  // Self-hosted fonts: no request to a third-party font CDN.
  css: [
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    '@fontsource-variable/hanken-grotesk/wght.css',
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
  ],

  typescript: {
    strict: true,
  },

  // Server-only: the browser talks to this app's server routes (server/api), never to FastAPI.
  runtimeConfig: {
    // FastAPI's URL as the Nuxt server sees it. Overridden at runtime by NUXT_API_BASE.
    apiBase: 'http://localhost:8000',
    // `Secure` on the token cookie; turn on (NUXT_COOKIE_SECURE=true) when served over HTTPS.
    cookieSecure: false,
  },

  // `npm run build:e2e` (the e2e and Lighthouse runs) builds into its own folders, so it
  // never overwrites the .nuxt/ of a running `nuxt dev`.
  $env: {
    e2e: {
      buildDir: '.nuxt-e2e',
      nitro: { output: { dir: '.output-e2e' } },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      // Page titles go through the titleTemplate in app.vue.
      meta: [
        // viewport-fit=cover lets the layout pad for notches with env(safe-area-inset-*).
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Record consultation notes with ICD-10 diagnosis codes.' },
        // --paper, so the mobile browser chrome blends into the page.
        { name: 'theme-color', content: '#f4f6f2' },
      ],
    },
  },
})
