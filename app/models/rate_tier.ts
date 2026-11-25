import Money from '#money/money'
import { RateTierSchema } from '#database/schema'

/**
 * A price the Operator sets that buys a fixed amount of time, such as ₱5
 * for 1 hour. No two Rate Tiers have the same price.
 */
export default class RateTier extends RateTierSchema {
  get price() {
    return new Money(this.priceCentavos)
  }
}
