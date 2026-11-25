import type { Page } from 'playwright'

/** Taps Insert Coin on the portal and waits for the Coin Window to open. */
export async function insertCoin(page: Page) {
  await page.getByRole('button', { name: 'Maghulog ng Barya', exact: true }).click()
  await page.getByRole('button', { name: 'Tapos na', exact: true }).waitFor()
}

/** Taps Done on the portal and waits for the Coin Window to close. */
export async function tapDone(page: Page) {
  await page.getByRole('button', { name: 'Tapos na', exact: true }).click()
  await page.getByRole('button', { name: 'Tapos na', exact: true }).waitFor({ state: 'detached' })
}
