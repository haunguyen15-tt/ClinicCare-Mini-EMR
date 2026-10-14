import { execFileSync } from 'node:child_process'
import { DB_FILE, PYTHON } from './env'

// Direct access to the e2e database, for states the UI cannot produce on its own.
// Python's sqlite3 module is used because the backend already needs Python.
function sql(statement: string, ...params: string[]): string {
  const script = [
    'import json, sqlite3, sys',
    'db = sqlite3.connect(sys.argv[1])',
    'rows = db.execute(sys.argv[2], sys.argv[3:]).fetchall()',
    'db.commit()',
    'print(json.dumps(rows))',
  ].join('\n')
  return execFileSync(PYTHON, ['-c', script, DB_FILE, statement, ...params], { encoding: 'utf-8' })
}

/**
 * Runs `action` while `code` is missing from the diagnosis catalogue, as if it had been
 * retired after the form loaded, then puts it back.
 */
export async function withDiagnosisRemoved(code: string, action: () => Promise<void>): Promise<void> {
  const [[description]] = JSON.parse(sql('SELECT description FROM diagnosis_codes WHERE code = ?', code)) as [[string]]
  sql('DELETE FROM diagnosis_codes WHERE code = ?', code)
  try {
    await action()
  } finally {
    sql('INSERT INTO diagnosis_codes (code, description) VALUES (?, ?)', code, description)
  }
}
