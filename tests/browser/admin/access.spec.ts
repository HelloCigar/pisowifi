import { test } from '@japa/runner'
import User from '#models/user'
import RateTier from '#models/rate_tier'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Admin panel access', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('sends a visitor who is not logged in from {$self} to the login')
    .with(['admin.dashboard', 'admin.rate_tiers.index', 'admin.rate_tiers.create'] as const)
    .run(async ({ visit, route }, routeName) => {
      await User.create({
        email: 'operator@example.com',
        password: 'secret1234',
      })

      const page = await visit(route(routeName))

      await page.assertPath(route('admin.session.create'))
    })

  test('sends a visitor who is not logged in from a Rate Tier edit page to the login', async ({
    visit,
    route,
  }) => {
    await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    const rateTier = await RateTier.create({ priceCentavos: 500, minutes: 60 })

    const page = await visit(route('admin.rate_tiers.edit', { id: rateTier.id }))

    await page.assertPath(route('admin.session.create'))
  })
})
