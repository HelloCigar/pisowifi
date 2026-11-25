import { inject } from '@adonisjs/core'
import transmit from '@adonisjs/transmit/services/main'
import Money from '#money/money'
import Setting from '#models/setting'
import type CoinAccepted from '#events/coin_accepted'
import CoinWindowService from '#services/coin_window_service'
import { LiveChannel } from '#values/live_channel'

/**
 * Records each coin the Coin Acceptor accepts, in the open Coin Window or as an
 * Orphan Coin.
 *
 * Before setup is finished, a coin can only come from the setup wizard's Coin
 * Acceptor test. It is shown to the wizard and not recorded: it is the
 * Operator's own coin, not takings.
 */
@inject()
export default class RecordCoin {
  constructor(protected coinWindows: CoinWindowService) {}

  async handle(event: CoinAccepted) {
    if (!(await Setting.current())) {
      const value = Money.fromPesos(event.pesos)
      transmit.broadcast(LiveChannel.CoinTest, {
        value: { raw: value.pesos, formatted: value.format() },
      })
      return
    }

    await this.coinWindows.receiveCoin(event.pesos)
  }
}
