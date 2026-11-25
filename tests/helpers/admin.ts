import type { Page } from 'playwright'

/**
 * Fills the setup wizard as a new Operator does, with one Rate Tier of ₱5
 * for 60 minutes. The Operator logs in as `operator@example.com` with the
 * password `secret1234`.
 */
export async function fillSetupWizard(page: Page) {
  await page.getByLabel('Email', { exact: true }).fill('operator@example.com')
  await page.getByLabel('Password', { exact: true }).fill('secret1234')
  await page.getByLabel('Confirm password', { exact: true }).fill('secret1234')
  await page.getByLabel('Hotspot name', { exact: true }).fill('Aling Nena WiFi')
  await page.getByLabel('Price of tier 1', { exact: true }).fill('5')
  await page.getByLabel('Minutes of tier 1', { exact: true }).fill('60')
}

/**
 * Submits the admin login form.
 */
export async function logIn(page: Page, email: string, password: string) {
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}
