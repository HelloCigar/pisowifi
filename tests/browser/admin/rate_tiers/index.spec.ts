import { test } from '@japa/runner'
import User from '#models/user'
import RateTier from '#models/rate_tier'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Rate Tiers list', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('shows each Rate Tier with its price and time', async ({ visit, route, browserContext }) => {
    const operator = await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    await RateTier.create({ priceCentavos: 500, minutes: 60 })
    await RateTier.create({ priceCentavos: 2000, minutes: 330 })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.index'))

    await page.assertVisible(page.getByRole('cell', { name: '₱5', exact: true }))
    await page.assertVisible(page.getByRole('cell', { name: '1 hour', exact: true }))
    await page.assertVisible(page.getByRole('cell', { name: '₱20', exact: true }))
    await page.assertVisible(page.getByRole('cell', { name: '5 hours 30 minutes', exact: true }))
  })

  test('says when there are no Rate Tiers', async ({ visit, route, browserContext }) => {
    const operator = await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.index'))

    await page.assertVisible(page.getByText('No Rate Tiers yet', { exact: true }))
  })
})
