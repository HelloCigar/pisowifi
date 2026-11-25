import { test } from '@japa/runner'
import User from '#models/user'
import RateTier from '#models/rate_tier'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Deleting a Rate Tier', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('removes it from the list', async ({ visit, route, browserContext }) => {
    const operator = await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    await RateTier.create({ priceCentavos: 500, minutes: 60 })
    await RateTier.create({ priceCentavos: 2000, minutes: 300 })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.rate_tiers.index'))
    await page.getByRole('button', { name: 'Delete the ₱5 Rate Tier', exact: true }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await page.assertNotExists(page.getByRole('cell', { name: '₱5', exact: true }))
    await page.assertVisible(page.getByRole('cell', { name: '₱20', exact: true }))
  })
})
