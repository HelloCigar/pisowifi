import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A request to the helper failed. `reason` is the error code of the helper
 * protocol (helper/PROTOCOL.md), such as `not_synced`, or `unavailable` when
 * the app has no connection to the helper.
 */
export default class HelperException extends Exception {
  static status = 503
  static code = 'E_HELPER_REQUEST_FAILED'

  constructor(
    public reason: string,
    message: string
  ) {
    super(message)
  }

  async handle(_error: this, ctx: HttpContext) {
    // flow-allow exception-handling.md: the recipe returns inertia.render(), but the
    // HTTP server ignores what handle() returns, so the rendered page is sent here.
    const page = await ctx.inertia.render('errors/server_error', {})
    ctx.response.status(HelperException.status).send(page)
  }
}
