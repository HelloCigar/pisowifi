import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Another Device holds the Coin Acceptor. The portal shows the Customer
 * when it will be free, so this only sends them back to it.
 */
export default class CoinAcceptorBusyException extends Exception {
  static status = 409
  static code = 'E_COIN_ACCEPTOR_BUSY'

  constructor(message = 'Another Device holds the Coin Acceptor') {
    super(message)
  }

  async handle(_error: this, ctx: HttpContext) {
    // flow-allow exception-handling.md: the recipe flashes the message, but the portal page
    // already says who holds the Coin Acceptor and when it is free, in the Customer's language.
    return ctx.response.redirect().back()
  }
}
