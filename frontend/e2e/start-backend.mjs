// Starts the real FastAPI backend for the e2e run (see playwright.config.ts) on a fresh
// SQLite database: the old file is deleted first, and the app seeds the ICD-10 codes and
// the demo doctor on startup, as it does in production.
import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const { E2E_PYTHON, E2E_DB_FILE, E2E_BACKEND_DIR, E2E_API_PORT } = process.env

for (const suffix of ['', '-journal', '-wal', '-shm']) rmSync(E2E_DB_FILE + suffix, { force: true })

const server = spawn(E2E_PYTHON, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', E2E_API_PORT], {
  cwd: E2E_BACKEND_DIR,
  stdio: 'inherit',
})
server.on('exit', (code) => process.exit(code ?? 1))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal))
