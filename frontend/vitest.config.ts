import { defineVitestConfig } from '@nuxt/test-utils/config'

// Unit tests run inside a Nuxt environment (auto-imports, plugins, runtime config) on happy-dom.
// The Playwright suite in e2e/ has its own runner, so only tests/ is collected here.
export default defineVitestConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'nuxt',
    environmentOptions: {
      nuxt: { domEnvironment: 'happy-dom' },
    },
  },
})
