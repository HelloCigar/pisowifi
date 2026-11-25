import { test } from '@japa/runner'
import User from '#models/user'
import RateTier from '#models/rate_tier'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Editing a Rate Tier', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('saves its new price and time', async ({ visit, route, browserContext }) => {
    const operator = await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    await RateTier.create({ priceCentavos: 500, minutes: 60 })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.index'))
    await page.getByRole('link', { name: 'Edit the ₱5 Rate Tier', exact: true }).click()
    await page.getByLabel('Price (₱)', { exact: true }).fill('10')
    await page.getByLabel('Minutes', { exact: true }).fill('120')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.assertPath(route('admin.rate_tiers.index'))
    await page.assertVisible(page.getByRole('cell', { name: '₱10', exact: true }))
    await page.assertVisible(page.getByRole('cell', { name: '2 hours', exact: true }))
  })

  test('keeps its own price when only the time changes', async ({
    visit,
    route,
    browserContext,
  }) => {
    const operator = await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    const rateTier = await RateTier.create({ priceCentavos: 500, minutes: 60 })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.edit', { id: rateTier.id }))
    await page.getByLabel('Minutes', { exact: true }).fill('45')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.assertPath(route('admin.rate_tiers.index'))
    await page.assertVisible(page.getByRole('cell', { name: '45 minutes', exact: true }))
  })

  test('refuses the price of another Rate Tier', async ({ visit, route, browserContext, db }) => {
    const operator = await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    await RateTier.create({ priceCentavos: 500, minutes: 60 })
    const rateTier = await RateTier.create({
      priceCentavos: 1000,
      minutes: 150,
    })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.edit', { id: rateTier.id }))
    await page.getByLabel('Price (₱)', { exact: true }).fill('5')
    await page.getByRole('button', { name: 'Save', exact: true }).click()

    await page.assertVisible(
      page.getByText('Another Rate Tier already has this price', {
        exact: true,
      })
    )
    await db.assertHas('rate_tiers', { id: rateTier.id, price_centavos: 1000 })
  })
})
