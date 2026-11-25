import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The helper knows no Device at the request's IP address, for example when the
 * request does not come from the Hotspot Network.
 */
export default class UnknownDeviceException extends Exception {
  static status = 403
  static code = 'E_UNKNOWN_DEVICE'

  constructor(message = 'No Device holds the IP address of this request') {
    super(message)
  }

  async handle(_error: this, ctx: HttpContext) {
    // flow-allow exception-handling.md: the recipe returns inertia.render(), but the
    // HTTP server ignores what handle() returns, so the rendered page is sent here.
    const page = await ctx.inertia.render('portal/unknown_device', {})
    ctx.response.status(UnknownDeviceException.status).send(page)
  }
}
