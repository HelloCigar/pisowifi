import type CoinWindow from '#models/coin_window'
import TimeSpan from '#time_span/time_span'
import type { PortalLanguage } from '#values/portal_language'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CoinWindowTransformer extends BaseTransformer<CoinWindow> {
  #language: PortalLanguage

  constructor(resource: CoinWindow, language: PortalLanguage) {
    super(resource)
    this.#language = language
  }

  /**
   * The time until the window closes, which is when the Coin Acceptor is
   * free again.
   */
  toObject() {
    return {
      closesIn: {
        raw: this.resource.secondsLeft,
        formatted: new TimeSpan(this.resource.secondsLeft).format(this.#language),
      },
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
