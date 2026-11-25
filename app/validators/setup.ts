import vine from '@vinejs/vine'

/**
 * The setup wizard: the Operator's login, the hotspot name and the first Rate
 * Tiers. Prices are whole pesos up to ₱10,000, and a Rate Tier buys at most 30
 * days.
 */
export const setupValidator = vine.create({
  email: vine.string().trim().email().maxLength(254),
  password: vine.string().minLength(8).maxLength(32).confirmed({ as: 'passwordConfirmation' }),
  hotspotName: vine.string().trim().minLength(1).maxLength(32),
  rateTiers: vine
    .array(
      vine.object({
        price: vine.number().withoutDecimals().range([1, 10_000]),
        minutes: vine.number().withoutDecimals().range([1, 43_200]),
      })
    )
    .notEmpty()
    .maxLength(20)
    .distinct('price'),
})
