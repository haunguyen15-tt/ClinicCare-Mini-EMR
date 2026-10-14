import { DOCTOR } from './support/env'
import { expect, test } from './support/fixtures'
import type { Page } from './support/fixtures'

/** The login page, set to return to `path` afterwards. */
async function expectLoginFor(page: Page, path: string) {
  await expect(page).toHaveURL((url) => url.pathname === '/login' && url.searchParams.get('redirect') === path)
}

test.describe('signed out', () => {
  for (const path of ['/', '/consultations', '/consultations/new', '/search?patient=Ann']) {
    test(`${path} redirects to the login page`, async ({ page }) => {
      await page.goto(path)

      await expectLoginFor(page, path)
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })
  }

  test('asks for both fields before calling the API', async ({ page, app }) => {
    await page.goto('/login')

    await app.press(page.getByRole('button', { name: 'Sign in' }))

    await expect(page.getByText('Enter your username.')).toBeVisible()
    await expect(page.getByText('Enter your password.')).toBeVisible()
    await expect(page.getByLabel('Username')).toBeFocused()
  })

  test('a wrong password shows the error and keeps the doctor on the login page', async ({ page, app }) => {
    await page.goto('/login?redirect=/consultations')

    await app.submitLogin(DOCTOR.username, 'not-the-password')

    // Filtered: Nuxt's route announcer is an alert too.
    const alert = page.getByRole('alert').filter({ hasText: 'Sign-in failed' })
    await expect(alert).toContainText('Incorrect username or password')
    await expect(page).toHaveURL('/login?redirect=/consultations')
    await expect(page.getByLabel('Password')).toHaveValue('')
    await expect(page.getByLabel('Password')).toBeFocused()
  })

  test('logging in lands on the page that asked for it', async ({ page, app }) => {
    await page.goto('/search?patient=Ann')
    await expect(page).toHaveURL(/\/login\?redirect=/)

    await app.submitLogin()

    await expect(page).toHaveURL('/search?patient=Ann')
    await expect(page.getByRole('searchbox', { name: 'Patient name' })).toHaveValue('Ann')
  })

  test('ignores a redirect to another site', async ({ page, app }) => {
    await page.goto('/login?redirect=https://example.com/')

    await app.submitLogin()

    await expect(page).toHaveURL('/')
  })
})

test.describe('signed in', () => {
  test('shows the doctor, survives a reload and skips the login page', async ({ page, app }) => {
    await app.signIn('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.reload()
    await expect(await app.navLink('Consultations')).toBeVisible()
    await expect(page.getByTitle(DOCTOR.fullName).filter({ visible: true })).toHaveText(DOCTOR.fullName)

    await page.goto('/login')
    await expect(page).toHaveURL('/')
  })

  test('logging out returns to /login and protected pages stay closed', async ({ page, app, context }) => {
    await app.signIn('/consultations')

    await app.logout()

    await expect(page).toHaveURL('/login')
    expect((await context.cookies()).find((cookie) => cookie.name === 'cc_token')).toBeUndefined()
    for (const path of ['/consultations', '/consultations/new', '/search']) {
      await page.goto(path)
      await expectLoginFor(page, path)
    }
  })
})
