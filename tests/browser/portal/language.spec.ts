import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { useFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Portal language', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('switches the portal from Filipino to English', async ({ visit, route }) => {
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await page.getByRole('button', { name: 'English', exact: true }).click()

    await page.assertVisible(
      page.getByRole('heading', { name: 'You have no Credit yet', exact: true })
    )
  })

  test('remembers the language on the next visit', async ({ visit, route }) => {
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.assertVisible(page.getByRole('button', { name: 'Filipino', exact: true }))

    const nextPage = await visit(route('portal'))

    await nextPage.assertVisible(
      nextPage.getByRole('heading', { name: 'You have no Credit yet', exact: true })
    )
  })

  test('switches the portal back to Filipino', async ({ visit, route }) => {
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('button', { name: 'Filipino', exact: true }).click()

    await page.assertVisible(
      page.getByRole('heading', { name: 'Wala ka pang Credit', exact: true })
    )
  })
})
