import { inject } from '@adonisjs/core'
import type CoinAccepted from '#events/coin_accepted'
import CoinWindowService from '#services/coin_window_service'

/**
 * Records each coin the Coin Acceptor accepts, in the open Coin Window or as
 * an Orphan Coin.
 */
@inject()
export default class RecordCoin {
  constructor(protected coinWindows: CoinWindowService) {}

  async handle(event: CoinAccepted) {
    await this.coinWindows.receiveCoin(event.pesos)
  }
}
