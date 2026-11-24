import { test } from '@japa/runner'
import User from '#models/user'
import RateTier from '#models/rate_tier'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Adding a Rate Tier', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('adds it to the list', async ({ visit, route, browserContext }) => {
    const operator = await User.create({ email: 'operator@example.com', password: 'secret1234' })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.index'))
    await page.getByRole('link', { name: 'Add a Rate Tier', exact: true }).click()
    await page.getByLabel('Price (₱)', { exact: true }).fill('10')
    await page.getByLabel('Minutes', { exact: true }).fill('150')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.assertPath(route('admin.rate_tiers.index'))
    await page.assertVisible(page.getByRole('cell', { name: '₱10', exact: true }))
    await page.assertVisible(page.getByRole('cell', { name: '2 hours 30 minutes', exact: true }))
  })

  test('refuses a price another Rate Tier has', async ({ visit, route, browserContext, db }) => {
    const operator = await User.create({ email: 'operator@example.com', password: 'secret1234' })
    await RateTier.create({ priceCentavos: 500, minutes: 60 })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.create'))
    await page.getByLabel('Price (₱)', { exact: true }).fill('5')
    await page.getByLabel('Minutes', { exact: true }).fill('90')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.assertVisible(
      page.getByText('Another Rate Tier already has this price', { exact: true })
    )
    await db.assertCount('rate_tiers', 1)
  })

  test('refuses a price over ₱10,000', async ({ visit, route, browserContext, db }) => {
    const operator = await User.create({ email: 'operator@example.com', password: 'secret1234' })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.create'))
    await page.getByLabel('Price (₱)', { exact: true }).fill('1e308')
    await page.getByLabel('Minutes', { exact: true }).fill('60')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.assertVisible(
      page.getByText('The price field must be between 1 and 10000', { exact: true })
    )
    await db.assertEmpty('rate_tiers')
  })
})
