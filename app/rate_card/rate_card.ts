import type Money from '#money/money'
import type { PricedTier } from '#types/rate_card'

/** The Operator's Rate Tiers, used together to price a Top-up. */
export default class RateCard {
  readonly tiers: readonly PricedTier[]

  constructor(tiers: PricedTier[]) {
    if (tiers.length === 0) {
      throw new RangeError('A rate card needs at least one Rate Tier')
    }
    this.tiers = tiers
  }

  /**
   * The tier with the lowest price. Any amount the tiers can't cover is priced
   * at its rate.
   */
  get cheapestTier() {
    return this.tiers.reduce((cheapest, tier) =>
      tier.price.centavos < cheapest.price.centavos ? tier : cheapest
    )
  }

  /**
   * The seconds of internet time an amount buys. The amount is split into Rate
   * Tiers, each usable more than once, and what is left is priced pro rata at
   * the cheapest tier's rate. Of all such splits, the one that buys the most
   * time wins, so no peso is wasted and six ₱1 coins buy at least as much as a
   * ₱5 and a ₱1 coin.
   */
  secondsFor(amount: Money) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const step =
      this.tiers.reduce((divisor, tier) => gcd(divisor, tier.price.centavos), amount.centavos) || 1
    const steps = Math.floor(amount.centavos / step)

    // best[i] is the most tier seconds that spend exactly i steps, or -1
    // when no mix of tiers adds up to that amount.
    const best = Array.from<number>({ length: steps + 1 }).fill(-1)
    best[0] = 0
    for (let spent = 1; spent <= steps; spent++) {
      for (const tier of this.tiers) {
        const tierSteps = tier.price.centavos / step
        if (tierSteps > spent || best[spent - tierSteps] < 0) {
          continue
        }
        best[spent] = Math.max(best[spent], best[spent - tierSteps] + tier.minutes * 60)
      }
    }

    const cheapest = this.cheapestTier
    return best.reduce((most, tierSeconds, spent) => {
      if (tierSeconds < 0) {
        return most
      }
      const leftCentavos = amount.centavos - spent * step
      const proRata = Math.floor((leftCentavos * cheapest.minutes * 60) / cheapest.price.centavos)
      return Math.max(most, tierSeconds + proRata)
    }, 0)
  }
}
