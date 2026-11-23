import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { useFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Helper events', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('records a Device that comes online', async ({ db }) => {
    const helper = useFakeHelperClient()

    await helper.sendDeviceOnline('aa:bb:cc:00:00:02', '10.0.0.12')

    await db.assertHas('devices', {
      mac_address: 'aa:bb:cc:00:00:02',
      last_ip_address: '10.0.0.12',
    })
  })
})
