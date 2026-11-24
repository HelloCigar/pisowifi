import type CoinWindow from '#models/coin_window'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CoinWindowTransformer extends BaseTransformer<CoinWindow> {
  /**
   * The time until the window closes, which is when the Coin Acceptor is
   * free again. The page counts it down and formats it (useCountdown).
   */
  toObject() {
    return {
      closesIn: { raw: this.resource.secondsLeft },
    }
  }

  /**
   * The window as the Device that holds it sees it, with the coins so far.
   * Preload `coins`.
   */
  forHolder() {
    const inserted = this.resource.inserted
    return {
      ...this.toObject(),
      inserted: { raw: inserted.pesos, formatted: inserted.format() },
    }
  }
}
