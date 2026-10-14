import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Ports and paths of the stack that playwright.config.ts starts. Ports differ from the dev
// defaults (3000/8000), so a running `nuxt dev` or uvicorn does not get in the way.
export const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3020)
export const API_PORT = Number(process.env.E2E_API_PORT ?? 8020)

// E2E_BASE_URL points the suite at an app that is already running (e.g. `docker compose`)
// instead of starting one. E2E_API_URL is then where the tests reach the API for setup.
export const EXTERNAL = Boolean(process.env.E2E_BASE_URL)
export const WEB_URL = process.env.E2E_BASE_URL ?? `http://localhost:${WEB_PORT}`
export const API_URL = process.env.E2E_API_URL ?? `http://127.0.0.1:${API_PORT}`

export const BACKEND_DIR = fileURLToPath(new URL('../../../backend', import.meta.url))
// A throwaway database, deleted before every run by e2e/start-backend.mjs.
export const DB_FILE = `${BACKEND_DIR}/data/e2e.db`

// The backend's virtualenv when there is one, else `python` from PATH (as in CI).
export const PYTHON =
  process.env.E2E_PYTHON
  ?? [`${BACKEND_DIR}/.venv/Scripts/python.exe`, `${BACKEND_DIR}/.venv/bin/python`].find((path) => existsSync(path))
  ?? 'python'

// The demo doctor the backend creates on startup (an external app may name it differently).
export const DOCTOR = {
  username: 'doctor',
  password: 'doctor123',
  fullName: process.env.E2E_DOCTOR_FULL_NAME ?? 'Dr. Avery Quinn',
}
