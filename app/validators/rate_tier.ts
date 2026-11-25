import vine from '@vinejs/vine'
import Money from '#money/money'

/**
 * Adding a Rate Tier. The price is a whole number of pesos up to ₱10,000,
 * and no other Rate Tier may have it. A Rate Tier buys at most 30 days.
 */
export const createRateTierValidator = vine.create({
  price: vine
    .number()
    .withoutDecimals()
    .range([1, 10_000])
    .unique(async (db, value) => {
      const taken = await db
        .from('rate_tiers')
        .where('price_centavos', Money.fromPesos(value).centavos)
        .first()
      return !taken
    }),
  minutes: vine.number().withoutDecimals().range([1, 43_200]),
})

/**
 * Editing a Rate Tier. It may keep its own price, but not take the price of
 * another Rate Tier.
 */
export const updateRateTierValidator = vine.withMetaData<{ rateTierId: number }>().create({
  price: vine
    .number()
    .withoutDecimals()
    .range([1, 10_000])
    .unique(async (db, value, field) => {
      const taken = await db
        .from('rate_tiers')
        .where('price_centavos', Money.fromPesos(value).centavos)
        .whereNot('id', field.meta.rateTierId)
        .first()
      return !taken
    }),
  minutes: vine.number().withoutDecimals().range([1, 43_200]),
})
