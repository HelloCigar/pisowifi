import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { useFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Portal before setup', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('tells Customers the Machine is not ready yet', async ({ visit, route }) => {
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))

    await page.assertVisible(
      page.getByRole('heading', { name: 'Hindi pa handa ang Machine', exact: true })
    )
  })
})
