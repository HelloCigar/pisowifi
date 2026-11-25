import { BaseEvent } from '@adonisjs/core/events'

/** The Coin Acceptor accepted a coin worth `pesos`, as the helper counted it. */
export default class CoinAccepted extends BaseEvent {
  constructor(public pesos: number) {
    super()
  }
}
