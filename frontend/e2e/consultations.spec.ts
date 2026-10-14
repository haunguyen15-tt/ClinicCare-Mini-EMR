import { withDiagnosisRemoved } from './support/db'
import { DOCTOR } from './support/env'
import { expect, test, uniqueTag } from './support/fixtures'
import type { App, Page } from './support/fixtures'

const form = (page: Page) => ({
  name: page.getByLabel('Full name'),
  dob: page.getByLabel('Date of birth'),
  codes: page.getByRole('combobox', { name: 'Diagnosis codes' }),
  chips: page.getByRole('list', { name: 'Selected diagnoses' }).getByRole('listitem'),
  notes: page.getByLabel('Clinical note'),
  save: page.getByRole('button', { name: 'Save consultation' }),
  alert: page.getByRole('alert').filter({ hasText: 'Not saved' }),
})

async function openForm(app: App) {
  await app.signIn('/consultations')
  await app.navigate('New consultation')
  await expect(app.page).toHaveURL('/consultations/new')
  await expect(app.page.getByRole('heading', { name: 'New consultation' })).toBeVisible()
}

test('records a consultation with two codes picked in the DiagnosisPicker', async ({ page, app, backend }) => {
  const patient = `Nora Ellison ${uniqueTag()}`
  const note = 'Fasting glucose 9.1 mmol/L. Blood pressure 152/94.\nStart metformin 500 mg, recheck in 4 weeks.'
  await openForm(app)
  const f = form(page)

  await f.name.fill(patient)
  await f.dob.fill('1971-05-23')

  // Keyboard: the first match is picked with ArrowDown + Enter, and the list stays open.
  await f.codes.fill('type 2 diabetes')
  await expect(app.option('E11.9')).toBeVisible()
  const first = await page.getByRole('option').first().getAttribute('id')
  await f.codes.press('ArrowDown')
  await expect(f.codes).toHaveAttribute('aria-activedescendant', first!)
  await f.codes.press('Enter')
  await expect(f.chips).toHaveCount(1)
  const firstCode = (await f.chips.first().locator('.font-mono').textContent())!.trim()
  expect(firstCode).toMatch(/^E11\./)

  // Pointer or touch: pick two more, then remove one of them with its chip button.
  await app.pickDiagnosis(f.codes, 'hypertension', 'I10')
  await app.pickDiagnosis(f.codes, 'asthma', 'J45.909')
  await expect(f.chips).toHaveCount(3)
  await app.press(page.getByRole('button', { name: 'Remove J45.909' }))
  await expect(f.chips).toHaveCount(2)
  await expect(page.getByText('2 / 20 codes')).toBeVisible()

  await f.notes.fill(note)
  await app.press(f.save)

  // Back on the list: a confirmation, and the new note first and highlighted.
  await expect(page).toHaveURL('/consultations')
  await expect(page.getByRole('status').filter({ hasText: `Consultation for ${patient} saved.` })).toBeVisible()
  const newest = app.records().first()
  await expect(newest).toContainText(patient)
  await expect(newest).toContainText(firstCode)
  await expect(newest).toContainText('I10')
  await expect(newest).toContainText('b. 23 May 1971')

  // Read back from the API: exactly what was entered, recorded by the signed-in doctor.
  const { items, total } = await backend.listConsultations({ patient })
  expect(total).toBe(1)
  expect(items[0]).toMatchObject({
    patient_name: patient,
    patient_dob: '1971-05-23',
    notes: note,
    doctor_name: DOCTOR.fullName,
    diagnoses: [expect.objectContaining({ code: firstCode }), expect.objectContaining({ code: 'I10' })],
  })
  const { items: latest } = await backend.listConsultations({ limit: 1 })
  expect(latest[0]!.id).toBe(items[0]!.id)
})

test('checks the form in the browser before sending it', async ({ page, app }) => {
  await openForm(app)
  const f = form(page)

  await app.press(f.save)

  await expect(page.getByText('Enter the patient’s name.')).toBeVisible()
  await expect(page.getByText('Add at least one diagnosis code.')).toBeVisible()
  await expect(page.getByText('Write the consultation note.')).toBeVisible()
  await expect(f.name).toBeFocused()
  await expect(page).toHaveURL('/consultations/new')
})

test('shows the server’s validation errors (422) next to their fields', async ({ page, app, backend }) => {
  // The browser's clock runs ahead of the server's, so a date of birth that the browser
  // accepts as past is in the future for the API, which rejects it with a 422.
  await page.clock.setFixedTime(new Date('2031-06-01T10:00:00'))
  const patient = `Owen Castell ${uniqueTag()}`
  await openForm(app)
  const f = form(page)

  await f.name.fill(patient)
  await f.dob.fill('2030-01-15')
  await app.pickDiagnosis(f.codes, 'headache', 'R51.9')
  await f.notes.fill('Tension-type headache for two weeks.')
  await app.press(f.save)

  await expect(f.alert).toContainText('Some fields need attention. Check the messages below.')
  await expect(page.locator('#patient_dob-error')).toHaveText('Date of birth cannot be in the future')
  await expect(f.dob).toHaveAttribute('aria-invalid', 'true')
  await expect(f.dob).toBeFocused()
  await expect(page).toHaveURL('/consultations/new')
  expect((await backend.listConsultations({ patient })).total).toBe(0)

  // Fixing the field and saving again goes through.
  await f.dob.fill('1990-01-15')
  await app.press(f.save)
  await expect(page).toHaveURL('/consultations')
  expect((await backend.listConsultations({ patient })).total).toBe(1)
})

test('shows the server’s error (400) for a code that no longer exists', async ({ page, app, backend }) => {
  const patient = `Priya Natarajan ${uniqueTag()}`
  await openForm(app)
  const f = form(page)

  await f.name.fill(patient)
  await app.pickDiagnosis(f.codes, 'migraine', 'G43.909')
  await f.notes.fill('Recurrent migraine, no aura.')
  // The chip's long description is truncated rather than widening the page.
  await app.expectNoSideScroll()

  await withDiagnosisRemoved('G43.909', async () => {
    await app.press(f.save)
    await expect(f.alert).toContainText('Unknown diagnosis code(s): G43.909')
  })

  await expect(page).toHaveURL('/consultations/new')
  // The form keeps what was typed, so the doctor can fix the code and save.
  await expect(f.name).toHaveValue(patient)
  await expect(f.chips).toHaveCount(1)
  expect((await backend.listConsultations({ patient })).total).toBe(0)
})
