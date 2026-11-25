import { test } from '@japa/runner'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { finishSetup } from '#tests/helpers/machine'
import { useFakeHelperClient } from '#tests/helpers/helper_client'

/**
 * The browser resolves every host name to the test server, as dnsmasq does for
 * a blocked Device on the Machine (see tests/bootstrap.ts).
 */
const port = env.get('PORT')

test.group('Captive redirect', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(() => finishSetup())

  test('sends a request for an unknown host to the portal', async ({ visit, route }) => {
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    // flow-allow testing.md: an unknown host has no route name, so the test visits its URL.
    const page = await visit(`http://example.com:${port}/news?page=2`)

    await page.assertUrl(`${env.get('APP_URL')}${route('portal')}`)
    await page.assertVisible(
      page.getByRole('heading', { name: 'Wala ka pang Credit', exact: true })
    )
  })

  test("sends an operating system's connectivity check to the portal")
    .with(['/generate_204', '/hotspot-detect.html', '/connecttest.txt'])
    .run(async ({ visit, route }, path) => {
      const helper = useFakeHelperClient()
      helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

      // flow-allow testing.md: a connectivity check is not a route of the app.
      const page = await visit(`${env.get('APP_URL')}${path}`)

      await page.assertUrl(`${env.get('APP_URL')}${route('portal')}`)
    })
})
