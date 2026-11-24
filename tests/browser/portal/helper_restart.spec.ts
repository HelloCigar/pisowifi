import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import HelperProvider from '#providers/helper_provider'
import { finishSetup } from '#tests/helpers/machine'
import { insertCoin, tapDone } from '#tests/helpers/portal'
import { useFakeHelperClient, useSyncedFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Helper restart', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(() => finishSetup())

  test('keeps a Device with a counting Credit online after the helper restarts', async ({
    visit,
    route,
    assert,
  }) => {
    const paying = await useSyncedFakeHelperClient()
    paying.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)
    await paying.sendCoin(5)
    await tapDone(page)

    const restarted = useFakeHelperClient()
    // flow-allow flow-design-tests: the client sends sync each time it connects; the test runs
    // the provider's start step to connect to the restarted fake helper as the app does.
    await new HelperProvider(app).ready()

    assert.deepEqual(restarted.lastSync, [
      { mac: 'aa:bb:cc:00:00:01', ip: '127.0.0.1', speedCap: { downKbps: 5000, upKbps: 2000 } },
    ])
  })

  test('turns inhibit off again when the helper restarts during a Coin Window', async ({
    visit,
    route,
    assert,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)

    const restarted = useFakeHelperClient()
    // flow-allow flow-design-tests: the client restores the helper each time it connects; the
    // test runs the provider's start step to connect to the restarted fake helper as the app does.
    await new HelperProvider(app).ready()

    assert.isFalse(restarted.inhibited)
  })
})
