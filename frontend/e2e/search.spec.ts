import { Backend } from './support/api'
import { expect, expectPath, test, uniqueTag } from './support/fixtures'
import type { Page } from './support/fixtures'

// Records created through the real API for this run only; names carry a unique tag, so
// patient searches see nothing else. Code searches also see other tests' notes, so they
// are checked against the API's own answer.
const tag = uniqueTag()
const family = `Brandt ${tag}`
const PAGED = 23

test.beforeAll(async () => {
  const backend = await Backend.signIn()
  const notes = 'Routine review.'
  await backend.createConsultation({ patient_name: `Hugo ${family}`, notes, diagnosis_codes: ['E11.65', 'I10'] })
  await backend.createConsultation({ patient_name: `Hana ${family}`, notes, diagnosis_codes: ['E11.9'] })
  await backend.createConsultation({ patient_name: `Ivo ${family}`, notes, diagnosis_codes: ['J45.909'] })
  for (let n = 1; n <= PAGED; n++) {
    const number = String(n).padStart(2, '0')
    await backend.createConsultation({ patient_name: `Paging ${tag} #${number}`, notes, diagnosis_codes: ['R51.9'] })
  }
  await backend.dispose()
})

const patientBox = (page: Page) => page.getByRole('searchbox', { name: 'Patient name' })
const codeBox = (page: Page) => page.getByRole('combobox', { name: 'Diagnosis code' })
const summary = (page: Page) => page.locator('#results-heading')
const pager = (page: Page) => page.getByRole('navigation', { name: 'Pagination' })

test('searches by part of the patient name as you type', async ({ page, app, backend }) => {
  await app.signIn('/consultations')
  await app.navigate('Search')
  await expect(page).toHaveURL('/search')

  await patientBox(page).fill(family.toUpperCase())

  await expectPath(page, `/search?patient=${encodeURIComponent(family.toUpperCase())}`)
  await expect(summary(page)).toHaveText(`3 consultations for “${family.toUpperCase()}”`)
  const records = app.records('Search results')
  await expect(records).toHaveCount(3)
  for (const name of ['Hugo', 'Hana', 'Ivo']) await expect(records.filter({ hasText: `${name} ${family}` })).toHaveCount(1)
  expect((await backend.listConsultations({ patient: family })).total).toBe(3)

  // A refresh keeps the search, since it lives in the URL.
  await page.reload()
  await expect(patientBox(page)).toHaveValue(family.toUpperCase())
  await expect(records).toHaveCount(3)
})

test('says when no patient matches', async ({ page, app }) => {
  await app.signIn('/search')

  await patientBox(page).fill(`Nobody ${tag}`)

  await expect(page.getByText('No matches.')).toBeVisible()
  await expect(page.getByText(`No patient name contains “Nobody ${tag}”.`)).toBeVisible()
  await expect(summary(page)).toHaveText(`0 consultations for “Nobody ${tag}”`)
})

test('searches by an exact diagnosis code picked from the list', async ({ page, app, backend }) => {
  await app.signIn('/search')

  await app.press(page.getByText('Diagnosis code', { exact: true }))
  await app.pickDiagnosis(codeBox(page), 'hyperglycemia', 'E11.65')

  await expect(page).toHaveURL('/search?diagnosis=E11.65')
  const { total } = await backend.listConsultations({ diagnosis: 'E11.65' })
  await expect(summary(page)).toHaveText(new RegExp(`^${total} consultations? for code E11\\.65$`))
  const records = app.records('Search results')
  await expect(records.filter({ hasText: `Hugo ${family}` })).toHaveCount(1)
  await expect(records.filter({ hasText: `Hana ${family}` })).toHaveCount(0)
  for (const record of await records.all()) await expect(record).toContainText('E11.65')
})

test('the open diagnosis list sits above the content below the search box', async ({ page, app }) => {
  await app.signIn('/search')
  await app.press(page.getByText('Diagnosis code', { exact: true }))
  // The page's entrance animations have played (the bug showed once they had settled).
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState === 'finished'))

  await codeBox(page).fill('ab')
  await expect(app.option('E11.9')).toBeVisible()

  // The list hangs over the "Results show here as you type." hint; the list must win.
  const hit = await page.evaluate(() => {
    const list = document.querySelector('[role=listbox]')!.getBoundingClientRect()
    const hint = [...document.querySelectorAll('p')].find((p) => p.textContent?.includes('Results show here'))!
    const box = hint.getBoundingClientRect()
    const left = Math.max(list.left, box.left)
    const right = Math.min(list.right, box.right)
    const top = Math.max(list.top, box.top)
    const bottom = Math.min(list.bottom, box.bottom)
    if (left >= right || top >= bottom) return 'no overlap'
    const element = document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
    return element?.closest('[role=listbox]') ? 'list' : 'hint'
  })
  expect(hit).toBe('list')
})

test('searches by a code prefix such as E11, and keeps it after a refresh', async ({ page, app, backend }) => {
  await app.signIn('/search')
  await app.press(page.getByText('Diagnosis code', { exact: true }))

  await codeBox(page).fill('e11')
  await expect(app.option('E11')).toContainText('Any code starting with E11')
  await app.press(app.option('E11'))

  await expect(page).toHaveURL('/search?diagnosis=E11')
  const { total } = await backend.listConsultations({ diagnosis: 'E11' })
  await expect(summary(page)).toHaveText(`${total} consultations for code E11`)
  const records = app.records('Search results')
  await expect(records.filter({ hasText: family })).toHaveCount(2)
  for (const record of await records.all()) await expect(record.locator('.code-stamp', { hasText: /^E11/ }).first()).toBeVisible()

  await page.reload()
  await expect(page.getByRole('radio', { name: 'Diagnosis code' })).toBeChecked()
  await expect(page.getByRole('list', { name: 'Selected diagnoses' })).toContainText('Any code starting with E11')
  await expect(records.filter({ hasText: family })).toHaveCount(2)
})

test('pages through search results with Older and Newer', async ({ page, app }) => {
  await app.signIn(`/search?patient=${encodeURIComponent(`Paging ${tag}`)}`)

  await expect(pager(page)).toContainText('1–20 of 23')
  const records = app.records('Search results')
  await expect(records).toHaveCount(20)
  await expect(records.first()).toContainText(`#${PAGED}`)

  await app.press(pager(page).getByRole('link', { name: 'Older' }))
  await expect(page).toHaveURL(/[?&]page=2(&|$)/)
  await expect(pager(page)).toContainText('21–23 of 23')
  await expect(records).toHaveCount(3)
  await expect(records.last()).toContainText('#01')
  await expect(pager(page).getByRole('link', { name: 'Older' })).toHaveCount(0)

  await page.reload()
  await expect(records).toHaveCount(3)

  await app.press(pager(page).getByRole('link', { name: 'Newer' }))
  await expect(page).not.toHaveURL(/page=/)
  await expect(records).toHaveCount(20)
})

test('pages through the consultation list', async ({ page, app, backend }) => {
  await app.signIn('/consultations')
  const { total, items } = await backend.listConsultations({ skip: 20, limit: 1 })

  await expect(page.getByText(`${total} notes on file, newest first.`)).toBeVisible()
  await expect(app.records()).toHaveCount(20)
  await app.press(pager(page).getByRole('link', { name: 'Older' }))

  await expect(page).toHaveURL('/consultations?page=2')
  await expect(app.records().first()).toContainText(items[0]!.patient_name)
})

test('every page fits the screen, and phones get cards instead of the table', async ({ page, app }, testInfo) => {
  await app.signIn('/')
  const narrow = testInfo.project.use.viewport!.width < 768

  for (const path of ['/', '/consultations', '/consultations/new', `/search?patient=${encodeURIComponent(family)}`]) {
    await page.goto(path)
    await expect(page.locator('main h1')).toBeVisible()
    await app.expectNoSideScroll()
  }

  await expect(app.records('Search results')).toHaveCount(3)
  await expect(page.locator('table')).toBeVisible({ visible: !narrow })
  await expect(page.getByRole('list', { name: 'Search results' })).toBeVisible({ visible: narrow })
})
