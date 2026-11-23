import { test } from '@japa/runner'
import User from '#models/user'
import limiter from '@adonisjs/limiter/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { logIn } from '#tests/helpers/admin'

test.group('Operator login', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(() => {
    return () => limiter.clear(['memory'])
  })

  test('lands the Operator on the admin panel', async ({ visit, route }) => {
    await User.create({ email: 'operator@example.com', password: 'secret1234' })

    const page = await visit(route('admin.session.create'))
    await logIn(page, 'operator@example.com', 'secret1234')

    await page.assertPath(route('admin.dashboard'))
  })

  test('refuses a wrong password', async ({ visit, route }) => {
    await User.create({ email: 'operator@example.com', password: 'secret1234' })

    const page = await visit(route('admin.session.create'))
    await logIn(page, 'operator@example.com', 'wrong-password')

    await page.assertVisible(page.getByText('Invalid user credentials', { exact: true }))
    await page.assertPath(route('admin.session.create'))
  })

  test('blocks the right password after repeated failures', async ({ visit, route }) => {
    await User.create({ email: 'operator@example.com', password: 'secret1234' })

    for (let attempt = 1; attempt <= 5; attempt++) {
      const failedPage = await visit(route('admin.session.create'))
      await logIn(failedPage, 'operator@example.com', 'wrong-password')
      await failedPage.assertVisible(
        failedPage.getByText('Invalid user credentials', { exact: true })
      )
    }

    const page = await visit(route('admin.session.create'))
    await logIn(page, 'operator@example.com', 'secret1234')

    await page.assertVisible(
      page.getByText('Too many attempts. Try again in 15 minutes.', { exact: true })
    )
    await page.assertPath(route('admin.session.create'))
  })
})

test.group('Operator logout', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('signs the Operator out of the admin panel', async ({ visit, route, browserContext }) => {
    const operator = await User.create({ email: 'operator@example.com', password: 'secret1234' })
    await browserContext.loginAs(operator)

    const page = await visit(route('admin.dashboard'))
    await page.getByRole('button', { name: 'Log out', exact: true }).click()
    await page.assertPath(route('admin.session.create'))

    const nextPage = await visit(route('admin.dashboard'))
    await nextPage.assertPath(route('admin.session.create'))
  })
})
