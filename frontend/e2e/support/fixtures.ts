import { test as base, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { Backend } from './api'
import { DOCTOR } from './env'

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A short tag that makes test data unique to one test run, e.g. "lq3k9x7". */
export function uniqueTag(): string {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 5)).slice(-9)
}

/** The page is at `path`, however its query is encoded (`%20` or `+`, `/` or `%2F`). */
export async function expectPath(page: Page, path: string): Promise<void> {
  await expect(page).toHaveURL((url) => {
    const expected = new URL(path, url)
    return url.pathname === expected.pathname && url.searchParams.toString() === expected.searchParams.toString()
  })
}

/** Page helpers that work on every device project: sidebar or menu sheet, table or cards. */
export class App {
  constructor(
    readonly page: Page,
    /** The project emulates a touch screen: taps instead of clicks. */
    readonly touch: boolean,
  ) {}

  async press(target: Locator): Promise<void> {
    if (this.touch) await target.tap()
    else await target.click()
  }

  /** Fills in and submits the login form on the current page. */
  async submitLogin(username: string = DOCTOR.username, password: string = DOCTOR.password): Promise<void> {
    await this.page.getByLabel('Username').fill(username)
    await this.page.getByLabel('Password').fill(password)
    await this.press(this.page.getByRole('button', { name: 'Sign in' }))
  }

  /** Opens `path`, signs in on the login page it redirects to, and waits to land back on `path`. */
  async signIn(path = '/'): Promise<void> {
    await this.page.goto(path)
    await expect(this.page).toHaveURL(/\/login\?redirect=/)
    await this.submitLogin()
    await expectPath(this.page, path)
  }

  /** The visible main navigation; below lg it lives in a menu sheet that is opened first. */
  async mainNav(): Promise<Locator> {
    const menu = this.page.getByRole('button', { name: 'Menu', exact: true })
    if (await menu.isVisible()) {
      await this.press(menu)
      await expect(this.page.getByRole('button', { name: 'Close', exact: true })).toHaveAttribute('aria-expanded', 'true')
    }
    return this.page.getByRole('navigation', { name: 'Main' })
  }

  /** A section link in the main nav; its name starts with the tab number, e.g. "01 Consultations". */
  async navLink(label: string): Promise<Locator> {
    const nav = await this.mainNav()
    return nav.getByRole('link', { name: new RegExp(`^\\d+ ${escapeRegExp(label)}$`) })
  }

  async navigate(label: string): Promise<void> {
    await this.press(await this.navLink(label))
  }

  async logout(): Promise<void> {
    const nav = await this.mainNav()
    // From lg up the account block sits below the sidebar's nav rather than inside it.
    const inMenu = nav.getByRole('button', { name: 'Log out' })
    await this.press((await inMenu.isVisible()) ? inMenu : this.page.getByRole('button', { name: 'Log out' }))
  }

  /** Consultation rows: ledger rows from md up, cards on phones. Only the visible view counts. */
  records(caption = 'Consultations'): Locator {
    const table = this.page.locator('table').filter({ has: this.page.locator('caption', { hasText: caption }) })
    const cards = this.page.getByRole('list', { name: caption, exact: true }).locator(':scope > li')
    return table.locator('tbody tr').or(cards).filter({ visible: true })
  }

  /** The option for `code` in an open DiagnosisPicker list. */
  option(code: string): Locator {
    return this.page.getByRole('option', { name: new RegExp(`^${escapeRegExp(code)}(…)? `) })
  }

  /** Types into a DiagnosisPicker and picks the option for `code`. */
  async pickDiagnosis(combobox: Locator, term: string, code: string): Promise<void> {
    await combobox.fill(term)
    const option = this.option(code)
    await expect(option).toBeVisible()
    await this.press(option)
  }

  /** The page has no horizontal scrollbar. */
  async expectNoSideScroll(): Promise<void> {
    const overflow = await this.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(0)
  }
}

interface Fixtures {
  app: App
  /** The real API, signed in as the demo doctor, for setup and read-backs. */
  backend: Backend
}

export const test = base.extend<Fixtures>({
  app: async ({ page }, use, testInfo) => {
    await use(new App(page, Boolean(testInfo.project.use.hasTouch)))
  },
  backend: async ({}, use) => {
    const backend = await Backend.signIn()
    await use(backend)
    await backend.dispose()
  },
})

export { expect }
export type { Locator, Page }
