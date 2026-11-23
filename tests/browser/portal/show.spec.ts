import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { useFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Portal', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('tells a Device with no Credit that it has none yet', async ({ visit, route }) => {
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))

    await page.assertVisible(
      page.getByRole('heading', { name: 'Wala ka pang Credit', exact: true })
    )
  })

  test('records the Device behind the IP address', async ({ visit, route, db }) => {
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'AA-BB-CC-00-00-01')

    const page = await visit(route('portal'))
    await page.assertVisible(page.getByText('aa:bb:cc:00:00:01', { exact: true }))

    await db.assertHas('devices', {
      mac_address: 'aa:bb:cc:00:00:01',
      last_ip_address: '127.0.0.1',
    })
  })

  test('says it cannot recognize an IP address no Device holds', async ({ visit, route, db }) => {
    useFakeHelperClient()

    const page = await visit(route('portal'))

    await page.assertVisible(
      page.getByRole('heading', { name: 'Hindi makilala ang iyong Device', exact: true })
    )
    await db.assertEmpty('devices')
  })
})
