import { test, freezeTime, timeTravel } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { finishSetup } from '#tests/helpers/machine'
import { insertCoin, tapDone } from '#tests/helpers/portal'
import { useSyncedFakeHelperClient } from '#tests/helpers/helper_client'
import CloseTimedOutCoinWindowsTask from '#tasks/close_timed_out_coin_windows.task'

/**
 * Six characters with no look-alikes, shown as `XXX-XXX`.
 */
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

  test('shows the coins inserted so far while the window is open', async ({ visit, route }) => {
    const helper = await useSyncedFakeHelperClient()
    helper.mapIp('127.0.0.1', 'aa:bb:cc:00:00:01')

    const page = await visit(route('portal'))
    await insertCoin(page)
    await helper.sendCoin(5)
    await helper.sendCoin(1)
    await page.reload()

    await page.assertVisible(page.getByText('₱6', { exact: true }))
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

  test('tells a second Device the Coin Acceptor is busy and when it is free', async ({
    visit,
    route,
  }) => {
    freezeTime()
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
      otherPage.getByText('Magagamit mo ito sa loob ng 1 minuto', { exact: true })
    )
    await otherPage.assertNotExists(
      otherPage.getByRole('button', { name: 'Maghulog ng Barya', exact: true })
    )
  })
})
