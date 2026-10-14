import colors from 'tailwindcss/colors'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    public: {
      // Overridden at runtime by NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:8000',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'ClinicCare Mini EMR',
      meta: [
        // viewport-fit=cover lets the layout pad for notches with env(safe-area-inset-*).
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Record consultation notes with ICD-10 diagnosis codes.' },
        { name: 'theme-color', content: colors.teal[700] },
      ],
    },
  },
})
