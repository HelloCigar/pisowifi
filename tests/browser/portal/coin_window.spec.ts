import { test, freezeTime, timeTravel } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { finishSetup } from '#tests/helpers/machine'
import { insertCoin, tapDone } from '#tests/helpers/portal'
import { useFakeHelperClient, useSyncedFakeHelperClient } from '#tests/helpers/helper_client'
import CloseTimedOutCoinWindowsTask from '#tasks/close_timed_out_coin_windows.task'

/** Six characters with no look-alikes, shown as `XXX-XXX`. */
const resumeCode = /^[A-HJKMNP-Z2-9]{3}-[A-HJKMNP-Z2-9]{3}$/

test.group('Coin Window', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(() => finishSetup())

  test('shows the Credit a ₱5 Top-up buys, with its Resume Code', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)

    await page.assertVisible(page.getByRole('heading', { name: 'Online ka na', exact: true }))
    await page.assertVisible(page.getByText('1 oras', { exact: true }))
    await page.assertVisible(page.getByText(resumeCode, { exact: true }))
  })

  test('lets the Device online with the speed cap from settings', async ({
    visit,
    route,
    assert,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)

    assert.deepEqual(helper.allowed.get('aa:bb:cc:00:00:01'), {
      mac: 'aa:bb:cc:00:00:01',
      ip: '127.0.0.1',
      speedCap: { downKbps: 5000, upKbps: 2000 },
    })
  })

  test('shows each coin on the open portal as it arrives, without a reload', async ({
    visit,
    route,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await page.getByText('₱5', { exact: true }).waitFor()
    await helper.sendCoin(1)

    await page.assertVisible(page.getByText('₱6', { exact: true }))
  })

  test('moves the close time forward on the open portal when a coin arrives', async ({
    visit,
    route,
    browserContext,
  }) => {
    freezeTime()
    // The page counts down on the browser's clock too; hold it still.
    await browserContext.clock.setFixedTime(Date.now())
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    timeTravel('30s')
    await page.reload()
    await page.getByText('30 segundo', { exact: true }).waitFor()
    await helper.sendCoin(1)

    await page.assertVisible(page.getByText('1 minuto', { exact: true }))
  })

  test('counts the Coin Window down on the open portal while no coins arrive', async ({
    visit,
    route,
    browserContext,
  }) => {
    freezeTime()
    const openedAt = Date.now()
    await browserContext.clock.setFixedTime(openedAt)
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await page.getByText('1 minuto', { exact: true }).waitFor()
    await browserContext.clock.setFixedTime(openedAt + 15_000)

    await page.assertVisible(page.getByText('45 segundo', { exact: true }))
  })

  test('tells a waiting Device the Coin Acceptor is taken, without a reload', async ({
    visit,
    route,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))
    await otherPage.getByRole('button', { name: 'Maghulog ng Barya', exact: true }).waitFor()
    // flow-allow flow-design-tests: every page comes from 127.0.0.1, which the fake helper
    // maps to one Device at a time, and the portal identifies a Device only by the
    // request's IP address. The waiting Device's reads are held until the address is its
    // own again; trusting a forwarded IP instead would let a Customer pose as any Device.
    let release = () => {}
    const released = new Promise<void>((resolve) => (release = resolve))
    await otherPage.route(
      (url) => url.pathname === '/',
      async (request) => {
        await released
        await request.continue()
      }
    )

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    release()

    await otherPage.assertVisible(
      otherPage.getByText('May gumagamit ng Coin Acceptor', { exact: true })
    )
  })

  test('credits a coin still in flight when Done is tapped', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    helper.dropCoinInFlight(1)
    await tapDone(page)

    await page.assertVisible(page.getByText('1 oras, 12 minuto', { exact: true }))
  })

  test('counts the Credit down as time passes', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)
    timeTravel('30m')
    await page.reload()

    await page.assertVisible(page.getByText('30 minuto', { exact: true }))
  })

  test('adds a Top-up to the time left, not to the time bought', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)
    timeTravel('30m')
    await page.reload()
    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)

    await page.assertVisible(page.getByText('1 oras, 30 minuto', { exact: true }))
  })

  test('adds a second Top-up to the same Credit and keeps its Resume Code', async ({
    visit,
    route,
    assert,
  }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)
    const firstCode = await page.getByText(resumeCode, { exact: true }).textContent()

    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)

    await page.assertVisible(page.getByText('2 oras', { exact: true }))
    assert.equal(await page.getByText(resumeCode, { exact: true }).textContent(), firstCode)
  })

  test('shows the time the last Top-up added', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await tapDone(page)
    await insertCoin(page)
    await helper.sendCoin(1)
    await tapDone(page)

    await page.assertVisible(page.getByText('12 minuto (₱1)', { exact: true }))
  })

  test('credits the coins when the window times out without Done', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    timeTravel('61s')
    // flow-allow flow-design-tests: the scheduler runs this task on its schedule; the test
    // runs it the way the scheduler does, after moving the clock past the close time.
    const task = await app.container.make(CloseTimedOutCoinWindowsTask)
    await task.run()
    await page.reload()

    await page.assertVisible(page.getByRole('heading', { name: 'Online ka na', exact: true }))
    await page.assertVisible(page.getByText('1 oras', { exact: true }))
  })

  test('shows the holder its coins after the close time, until the window is closed', async ({
    visit,
    route,
  }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    timeTravel('61s')
    await page.reload()

    await page.assertVisible(page.getByText('₱5', { exact: true }))
  })

  test('keeps the window open while coins keep coming', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    timeTravel('50s')
    await helper.sendCoin(1)
    timeTravel('20s')
    // flow-allow flow-design-tests: the scheduler runs this task on its schedule; the test
    // runs it the way the scheduler does, after moving the clock forward.
    const task = await app.container.make(CloseTimedOutCoinWindowsTask)
    await task.run()
    await page.reload()

    await page.assertVisible(page.getByRole('button', { name: 'Tapos na', exact: true }))
  })

  test('does not let a coin after the close time keep the window open', async ({
    visit,
    route,
  }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    timeTravel('61s')
    await helper.sendCoin(1)
    // flow-allow flow-design-tests: the scheduler runs this task on its schedule; the test
    // runs it the way the scheduler does, after moving the clock past the close time.
    const task = await app.container.make(CloseTimedOutCoinWindowsTask)
    await task.run()
    await page.reload()

    await page.assertVisible(page.getByText('12 minuto', { exact: true }))
  })

  test('frees the Coin Acceptor once the window times out, before the task runs', async ({
    visit,
    route,
  }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)
    timeTravel('61s')

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))
    await insertCoin(otherPage)

    await otherPage.assertVisible(otherPage.getByRole('button', { name: 'Tapos na', exact: true }))
  })

  test('turns inhibit off while the window is open', async ({ visit, route, assert }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)

    assert.isFalse(helper.inhibited)
  })

  test('turns inhibit back on when the window closes', async ({ visit, route, assert }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await tapDone(page)

    assert.isTrue(helper.inhibited)
  })

  test('gives no Credit for a window with no coins', async ({ visit, route }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await tapDone(page)

    await page.assertVisible(
      page.getByRole('heading', { name: 'Wala ka pang Credit', exact: true })
    )
  })

  test('turns a second Device away when it taps Insert Coin while the window is held', async ({
    visit,
    route,
    browserContext,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    // The second Device has lost its live connection, as a phone that slept
    // does, so its page still offers Insert Coin.
    await browserContext.route('**/__transmit/**', (request) => request.abort())
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    await otherPage.getByRole('button', { name: 'Maghulog ng Barya', exact: true }).click()

    await otherPage.assertVisible(
      otherPage.getByText('May gumagamit ng Coin Acceptor', { exact: true })
    )
  })

  test('keeps the window of the Device that holds it when a second Device tries to', async ({
    visit,
    route,
    browserContext,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    // The second Device has lost its live connection, as a phone that slept
    // does, so its page still offers Insert Coin.
    await browserContext.route('**/__transmit/**', (request) => request.abort())
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    await otherPage.getByRole('button', { name: 'Maghulog ng Barya', exact: true }).click()
    await otherPage.getByText('May gumagamit ng Coin Acceptor', { exact: true }).waitFor()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    await page.reload()

    await page.assertVisible(page.getByRole('button', { name: 'Tapos na', exact: true }))
  })

  test('ignores Done from a Device whose window has already closed', async ({ visit, route }) => {
    freezeTime()
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))
    await insertCoin(otherPage)
    timeTravel('61s')
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    await otherPage.getByRole('button', { name: 'Tapos na', exact: true }).click()
    await otherPage.getByText('May gumagamit ng Coin Acceptor', { exact: true }).waitFor()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    await page.reload()

    await page.assertVisible(page.getByText('₱5', { exact: true }))
  })

  test('gives the Coin Acceptor to a waiting Device once it is free, without a reload', async ({
    visit,
    route,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))
    await otherPage.getByText('May gumagamit ng Coin Acceptor', { exact: true }).waitFor()

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    await tapDone(page)
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')

    await otherPage.assertVisible(
      otherPage.getByRole('button', { name: 'Maghulog ng Barya', exact: true })
    )
  })

  test('keeps inhibit on when the Operator has deleted every Rate Tier', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const operator = await User.create({
      email: 'operator@example.com',
      password: 'secret1234',
    })
    await browserContext.loginAs(operator)
    const page = await visit(route('portal'))
    const admin = await visit(route('admin.rate_tiers.index'))
    await admin.getByRole('button', { name: 'Delete the ₱5 Rate Tier', exact: true }).click()
    await admin.getByRole('button', { name: 'Delete', exact: true }).click()
    await admin.getByRole('cell', { name: '₱5', exact: true }).waitFor({ state: 'detached' })

    await page.getByRole('button', { name: 'Maghulog ng Barya', exact: true }).click()
    await page.getByRole('heading', { name: 'Hindi pa handa ang Machine', exact: true }).waitFor()

    assert.isTrue(helper.inhibited)
  })

  test('frees the Coin Acceptor when the helper cannot turn inhibit off', async ({
    visit,
    route,
  }) => {
    // Not synced yet, as just after the helper restarts, so it refuses to
    // turn the inhibit line off.
    const helper = useFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await page.getByRole('button', { name: 'Maghulog ng Barya', exact: true }).click()
    await page.waitForLoadState('networkidle')

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))

    await otherPage.assertVisible(
      otherPage.getByRole('button', { name: 'Maghulog ng Barya', exact: true })
    )
  })

  test('tells a second Device the Coin Acceptor is busy and when it is free', async ({
    visit,
    route,
    browserContext,
  }) => {
    freezeTime()
    // The page counts down on the browser's clock too; hold it still.
    await browserContext.clock.setFixedTime(Date.now())
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')
    const page = await visit(route('portal'))
    await insertCoin(page)

    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:02')
    const otherPage = await visit(route('portal'))

    await otherPage.assertVisible(
      otherPage.getByText('May gumagamit ng Coin Acceptor', { exact: true })
    )
    await otherPage.assertVisible(
      otherPage.getByText('Magagamit mo ito sa loob ng 1 minuto', {
        exact: true,
      })
    )
    await otherPage.assertNotExists(
      otherPage.getByRole('button', { name: 'Maghulog ng Barya', exact: true })
    )
  })
})
