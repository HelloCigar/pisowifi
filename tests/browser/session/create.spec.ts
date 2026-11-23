import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Login page', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('sends a signed-in Operator to the admin panel, not the portal', async ({
    visit,
    route,
    browserContext,
  }) => {
    const operator = await User.create({ email: 'operator@example.com', password: 'secret1234' })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.session.create'))

    await page.assertPath(route('admin.dashboard'))
  })
})
