import { inject } from '@adonisjs/core'
import { Task, type TaskOptions } from '@outloud/adonis-scheduler'
import CoinWindow from '#models/coin_window'
import CoinWindowService from '#services/coin_window_service'

/**
 * Closes each Coin Window whose close time has passed, so a Customer who
 * forgets to tap Done still gets the coins credited. Closing a window that
 * is already closed does nothing, so a run can repeat safely.
 *
 * It runs in the web process, which holds the connection to the helper
 * (SCHEDULER_HTTP_SERVER=true): a Machine is one process.
 */
@inject()
export default class CloseTimedOutCoinWindowsTask extends Task {
  static options: TaskOptions = {
    name: 'close-timed-out-coin-windows',
    schedule: '*/5 * * * * *',
  }

  constructor(protected coinWindows: CoinWindowService) {
    super()
  }

  async run() {
    for (const window of await CoinWindow.timedOut()) {
      if (this.isCanceled) {
        return
      }
      await this.coinWindows.close(window)
    }
  }
}
