import { chromium } from 'playwright'
import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { browserClient } from '@japa/browser-client'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { dbAssertions } from '@adonisjs/lucid/plugins/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { authBrowserClient } from '@adonisjs/auth/plugins/browser_client'
import { sessionBrowserClient } from '@adonisjs/session/plugins/browser_client'

/** This file is imported by the "bin/test.ts" entrypoint file */

/**
 * Configure Japa plugins in the plugins array. Learn more -
 * https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  dbAssertions(app),
  browserClient({
    runInSuites: ['browser'],
    /**
     * On the Machine, dnsmasq answers every name a blocked Device looks up with
     * the portal's address. The browser does the same here: every host name
     * resolves to the test server, so a test can open "http://example.com/" and
     * see the captive redirect.
     */
    launcher: (config) =>
      chromium.launch({
        ...config,
        args: ['--host-resolver-rules=MAP * 127.0.0.1'],
      }),
  }),
  sessionBrowserClient(app),
  authBrowserClient(app),
]

/**
 * Configure lifecycle function to run before and after all the tests.
 *
 * The setup functions are executed before all the tests The teardown functions
 * are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [() => testUtils.db().migrate()],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance. Learn more -
 * https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
