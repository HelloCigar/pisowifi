import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Device from '#models/device'
import { finishSetup } from '#tests/helpers/machine'
import { subscribeFromPage } from '#tests/helpers/transmit'
import { useSyncedFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Coin Window channel', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(() => finishSetup())

  test('lets a Device subscribe to its own Coin Window', async ({ visit, route, assert }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    const device = await Device.findByOrFail('macAddress', 'aa:bb:cc:00:00:01')

    const status = await subscribeFromPage(page, Device.coinWindowChannel(device.id))

    assert.equal(status, 204)
  })

  test("refuses a Device a subscription to another Device's Coin Window", async ({
    visit,
    route,
    assert,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    await visit(route('portal'))
    const other = await Device.findByOrFail('macAddress', 'aa:bb:cc:00:00:02')
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))

    const status = await subscribeFromPage(page, Device.coinWindowChannel(other.id))

    assert.equal(status, 400)
  })
})
