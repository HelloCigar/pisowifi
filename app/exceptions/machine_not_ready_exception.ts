import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The Machine is not set up yet, so it serves no Customer. The Operator
 * finishes the setup wizard first.
 */
export default class MachineNotReadyException extends Exception {
  static status = 503
  static code = 'E_MACHINE_NOT_READY'

  constructor(message = 'The Machine is not set up yet') {
    super(message)
  }

  async handle(_error: this, ctx: HttpContext) {
    // flow-allow exception-handling.md: the recipe returns inertia.render(), but the
    // HTTP server ignores what handle() returns, so the rendered page is sent here.
    const page = await ctx.inertia.render('portal/not_ready', {})
    ctx.response.status(MachineNotReadyException.status).send(page)
  }
}
