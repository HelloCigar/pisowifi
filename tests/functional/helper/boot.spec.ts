import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import HelperProvider from '#providers/helper_provider'
import { useFakeHelperClient } from '#tests/helpers/helper_client'

test.group('Helper at boot', () => {
  test('sends sync with no Devices, since no Credit exists yet', async ({ assert }) => {
    const helper = useFakeHelperClient()

    // flow-allow flow-design-tests: the app boots before a test can swap the client, so the
    // test runs the provider's boot step itself to reach the helper as the booting app does.
    await new HelperProvider(app).ready()

    assert.deepEqual(helper.lastSync, [])
  })
})
