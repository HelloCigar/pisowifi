import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Setting from '#models/setting'
import MachineNotReadyException from '#exceptions/machine_not_ready_exception'

/**
 * Refuses Customers until the Operator has finished the setup wizard, so
 * nobody gets online before the Rate Tiers are set.
 */
export default class RequireSetupMiddleware {
  async handle(_ctx: HttpContext, next: NextFn) {
    const settings = await Setting.current()
    if (!settings) {
      throw new MachineNotReadyException()
    }

    return next()
  }
}
