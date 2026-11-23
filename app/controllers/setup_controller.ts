import User from '#models/user'
import Setting from '#models/setting'
import Money from '#money/money'
import RateTier from '#models/rate_tier'
import db from '@adonisjs/lucid/services/db'
import { setupValidator } from '#validators/setup'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The setup wizard a newly installed Machine boots into. It creates the
 * Operator, the settings and the first Rate Tiers, and closes for good once
 * an Operator exists.
 */
export default class SetupController {
  async create({ inertia, response }: HttpContext) {
    if (await User.operatorExists()) {
      return response.redirect().toRoute('admin.session.create')
    }

    return inertia.render('setup/create', {})
  }

  async store({ request, response, auth, session }: HttpContext) {
    const { email, password, hotspotName, rateTiers } = await request.validateUsing(setupValidator)

    const operator = await db.transaction(async (trx) => {
      if (await User.operatorExists({ client: trx })) {
        return null
      }

      const created = await User.create({ email, password }, { client: trx })
      await Setting.createWithDefaults(hotspotName, { client: trx })
      await RateTier.createMany(
        rateTiers.map((tier) => ({
          priceCentavos: Money.fromPesos(tier.price).centavos,
          minutes: tier.minutes,
        })),
        { client: trx }
      )

      return created
    })

    if (!operator) {
      session.flash('error', 'This Machine is already set up')
      return response.redirect().toRoute('admin.session.create')
    }

    await auth.use('web').login(operator)
    return response.redirect().toRoute('admin.dashboard')
  }
}
