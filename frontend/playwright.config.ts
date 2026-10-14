import { defineConfig, devices } from '@playwright/test'
import { API_PORT, API_URL, BACKEND_DIR, DB_FILE, DOCTOR, PYTHON, WEB_PORT, WEB_URL } from './e2e/support/env'

// End-to-end tests against the real stack: the FastAPI backend on a fresh SQLite database
// and the production Nuxt build. No request is mocked or intercepted.
export default defineConfig({
  testDir: './e2e',
  // One worker: every test shares one database, and some check what is newest.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],

  webServer: [
    {
      command: 'node e2e/start-backend.mjs',
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        E2E_PYTHON: PYTHON,
        E2E_DB_FILE: DB_FILE,
        E2E_BACKEND_DIR: BACKEND_DIR,
        E2E_API_PORT: String(API_PORT),
        // These override backend/.env, so the run does not depend on local settings.
        DATABASE_URL: `sqlite:///${DB_FILE}`,
        CORS_ORIGINS: WEB_URL,
        JWT_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
        ACCESS_TOKEN_EXPIRE_MINUTES: '60',
        DEMO_DOCTOR_USERNAME: DOCTOR.username,
        DEMO_DOCTOR_PASSWORD: DOCTOR.password,
        DEMO_DOCTOR_FULL_NAME: DOCTOR.fullName,
      },
    },
    {
      // The production build, in its own folders (see $env.e2e in nuxt.config.ts).
      command: 'npm run build:e2e && node .output-e2e/server/index.mjs',
      url: `${WEB_URL}/login`,
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        PORT: String(WEB_PORT),
        NUXT_PUBLIC_API_BASE: API_URL,
      },
    },
  ],
})
