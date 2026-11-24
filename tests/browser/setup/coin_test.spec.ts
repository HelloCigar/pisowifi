import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { useSyncedFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Setup wizard: Coin Acceptor test', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('shows the value of each coin the Operator inserts', async ({ visit, route }) => {
    const helper = await useSyncedFakeHelperClient()

    const page = await visit(route('coin_test.create'))
    await page.getByRole('button', { name: 'Start the test', exact: true }).click()
    await page.getByText('Insert a coin now', { exact: true }).waitFor()
    await helper.sendCoin(5)

    await page.assertVisible(page.getByRole('listitem').getByText('₱5', { exact: true }))
  })

  test('lets the Coin Acceptor take coins while the test runs', async ({
    visit,
    route,
    assert,
  }) => {
    const helper = await useSyncedFakeHelperClient()

    const page = await visit(route('coin_test.create'))
    await page.getByRole('button', { name: 'Start the test', exact: true }).click()
    await page.getByRole('button', { name: 'Stop the test', exact: true }).waitFor()

    assert.isFalse(helper.inhibited)
  })

  test('makes the Coin Acceptor reject coins again when the test stops', async ({
    visit,
    route,
    assert,
  }) => {
    const helper = await useSyncedFakeHelperClient()

    const page = await visit(route('coin_test.create'))
    await page.getByRole('button', { name: 'Start the test', exact: true }).click()
    await page.getByRole('button', { name: 'Stop the test', exact: true }).click()
    await page.getByRole('button', { name: 'Start the test', exact: true }).waitFor()

    assert.isTrue(helper.inhibited)
  })

  test('cannot be reached once an Operator exists', async ({ visit, route }) => {
    await useSyncedFakeHelperClient()
    await User.create({ email: 'operator@example.com', password: 'secret1234' })

    const page = await visit(route('coin_test.create'))

    await page.assertPath(route('admin.session.create'))
  })

  test('leads on to the rest of the setup wizard', async ({ visit, route }) => {
    await useSyncedFakeHelperClient()

    const page = await visit(route('coin_test.create'))
    await page.getByRole('link', { name: 'Next', exact: true }).click()

    await page.assertPath(route('setup.create'))
  })
})
