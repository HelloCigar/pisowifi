import Money from '#money/money'
import RateTier from '#models/rate_tier'
import RateTierTransformer from '#transformers/rate_tier_transformer'
import { createRateTierValidator, updateRateTierValidator } from '#validators/rate_tier'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The Operator's Rate Tiers.
 *
 * Every touch here is global on purpose: the Rate Tiers belong to the whole
 * Machine, which its one Operator owns, and the auth middleware lets only that
 * Operator in.
 */
export default class RateTiersController {
  async index({ inertia }: HttpContext) {
    return inertia.render('admin/rate_tiers/index', {
      rateTiers: async () => {
        const rateTiers = await RateTier.query().orderBy('price_centavos', 'asc')
        return RateTierTransformer.transform(rateTiers)
      },
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('admin/rate_tiers/create', {})
  }

  async store({ request, response, session }: HttpContext) {
    const { price, minutes } = await request.validateUsing(createRateTierValidator)

    await RateTier.create({
      priceCentavos: Money.fromPesos(price).centavos,
      minutes,
    })

    session.flash('success', 'Rate Tier added')
    return response.redirect().toRoute('admin.rate_tiers.index')
  }

  async edit({ inertia, params }: HttpContext) {
    return inertia.render('admin/rate_tiers/edit', {
      rateTier: async () => RateTierTransformer.transform(await RateTier.findOrFail(params.id)),
    })
  }

  async update({ params, request, response, session }: HttpContext) {
    const rateTier = await RateTier.findOrFail(params.id)
    const { price, minutes } = await request.validateUsing(updateRateTierValidator, {
      meta: { rateTierId: rateTier.id },
    })

    rateTier.merge({ priceCentavos: Money.fromPesos(price).centavos, minutes })
    await rateTier.save()

    session.flash('success', 'Rate Tier saved')
    return response.redirect().toRoute('admin.rate_tiers.index')
  }

  async destroy({ params, response, session }: HttpContext) {
    const rateTier = await RateTier.findOrFail(params.id)
    await rateTier.delete()

    session.flash('success', 'Rate Tier deleted')
    return response.redirect().toRoute('admin.rate_tiers.index')
  }
}
