import { test } from '@japa/runner'
import User from '#models/user'
import Setting from '#models/setting'
import testUtils from '@adonisjs/core/services/test_utils'
import { fillSetupWizard } from '#tests/helpers/admin'
import { useSyncedFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Setup wizard', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('lands the new Operator signed in on the admin panel', async ({ visit, route }) => {
    const page = await visit(route('setup.create'))
    await fillSetupWizard(page)
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()

    await page.assertPath(route('admin.dashboard'))
    await page.assertVisible(page.getByRole('button', { name: 'Log out', exact: true }))
  })

  test('saves the Rate Tiers it was given', async ({ visit, route, db }) => {
    const page = await visit(route('setup.create'))
    await fillSetupWizard(page)
    await page.getByRole('button', { name: 'Add a Rate Tier', exact: true }).click()
    await page.getByLabel('Price of tier 2', { exact: true }).fill('20')
    await page.getByLabel('Minutes of tier 2', { exact: true }).fill('300')
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.assertPath(route('admin.dashboard'))

    await db.assertHas('rate_tiers', { price_centavos: 500, minutes: 60 })
    await db.assertHas('rate_tiers', { price_centavos: 2000, minutes: 300 })
  })

  test('creates the settings with the hotspot name and the defaults', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visit(route('setup.create'))
    await fillSetupWizard(page)
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.assertPath(route('admin.dashboard'))

    const settings = await Setting.current()
    assert.deepEqual(settings?.data, {
      hotspotName: 'Aling Nena WiFi',
      coinWindowSeconds: 60,
      autoPauseMinutes: 5,
      expiryDays: 7,
      speedCapDownMbps: 5,
      speedCapUpMbps: 2,
    })
  })

  test('refuses two Rate Tiers with the same price', async ({ visit, route, db }) => {
    const page = await visit(route('setup.create'))
    await fillSetupWizard(page)
    await page.getByRole('button', { name: 'Add a Rate Tier', exact: true }).click()
    await page.getByLabel('Price of tier 2', { exact: true }).fill('5')
    await page.getByLabel('Minutes of tier 2', { exact: true }).fill('90')
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()

    await page.assertVisible(
      page.getByText('Two Rate Tiers cannot have the same price', { exact: true })
    )
    await db.assertEmpty('users')
  })

  test('cannot be reached once an Operator exists', async ({ visit, route }) => {
    await User.create({ email: 'operator@example.com', password: 'secret1234' })

    const page = await visit(route('setup.create'))

    await page.assertPath(route('admin.session.create'))
  })

  test('opens on the Coin Acceptor test from the admin login while the Machine has no Operator', async ({
    visit,
    route,
  }) => {
    await useSyncedFakeHelperClient()

    const page = await visit(route('admin.session.create'))

    await page.assertPath(route('coin_test.create'))
  })

  test('makes the Coin Acceptor reject coins once setup is finished', async ({
    visit,
    route,
    assert,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    const testPage = await visit(route('coin_test.create'))
    await testPage.getByRole('button', { name: 'Start the test', exact: true }).click()
    await testPage.getByRole('button', { name: 'Stop the test', exact: true }).waitFor()

    const page = await visit(route('setup.create'))
    await fillSetupWizard(page)
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.assertPath(route('admin.dashboard'))

    assert.isTrue(helper.inhibited)
  })
})
