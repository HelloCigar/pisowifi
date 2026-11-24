import type Money from '#money/money'

/**
 * One Rate Tier as the rate card reads it: a price that buys a number of
 * minutes. A RateTier model has this shape.
 */
export type PricedTier = {
  price: Money
  minutes: number
}
