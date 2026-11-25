import { test } from '@japa/runner'
import Money from '#money/money'
import RateCard from '#rate_card/rate_card'

test.group('Rate card', () => {
  test('prices ₱{pesos} at {minutes} minutes with the tiers {tiers}')
    .with([
      // One tier
      { tiers: '₱5=60', pesos: 5, minutes: 60 },
      { tiers: '₱5=60', pesos: 10, minutes: 120 },
      // The ₱1 left over buys a fifth of the ₱5 tier
      { tiers: '₱5=60', pesos: 6, minutes: 72 },
      { tiers: '₱5=60', pesos: 1, minutes: 12 },
      // Several tiers, each usable more than once
      { tiers: '₱1=10 ₱5=60 ₱10=130', pesos: 6, minutes: 70 },
      { tiers: '₱1=10 ₱5=60 ₱10=130', pesos: 15, minutes: 190 },
      { tiers: '₱1=10 ₱5=60 ₱10=130', pesos: 20, minutes: 260 },
      // The best mix is not the greedy one: ₱3 + ₱3 beats ₱4 + ₱1 + ₱1
      { tiers: '₱1=10 ₱3=40 ₱4=50', pesos: 6, minutes: 80 },
      // ₱3 no tier covers is priced at the cheapest tier, ₱5 for 60 minutes
      { tiers: '₱5=60 ₱10=150', pesos: 13, minutes: 186 },
      { tiers: '₱5=60 ₱10=150', pesos: 7, minutes: 84 },
      // Leaving ₱1 to the pro-rata rate beats spending it on a worse tier
      { tiers: '₱2=20 ₱3=21', pesos: 3, minutes: 30 },
      // Six ₱1 coins buy at least as much as a ₱5 and a ₱1 coin
      { tiers: '₱1=12 ₱5=50', pesos: 6, minutes: 72 },
    ])
    .run(({ assert }, { tiers, pesos, minutes }) => {
      const rateCard = new RateCard(
        tiers.split(' ').map((tier) => {
          const [price, tierMinutes] = tier.slice(1).split('=')
          return {
            price: Money.fromPesos(Number(price)),
            minutes: Number(tierMinutes),
          }
        })
      )

      assert.equal(rateCard.secondsFor(Money.fromPesos(pesos)), minutes * 60)
    })

  test('rounds the pro-rata part down to whole seconds')
    .with([
      // ₱1 is a seventh of the ₱7 tier's 10 minutes: 85.71 seconds
      { pesos: 1, seconds: 85 },
      { pesos: 2, seconds: 171 },
      // The ₱7 tier, then ₱1 at the pro-rata rate
      { pesos: 8, seconds: 685 },
    ])
    .run(({ assert }, { pesos, seconds }) => {
      const rateCard = new RateCard([{ price: Money.fromPesos(7), minutes: 10 }])

      assert.equal(rateCard.secondsFor(Money.fromPesos(pesos)), seconds)
    })

  test('prices ₱1 at 6 minutes 40 seconds when the cheapest tier is ₱3 for 20 minutes', ({
    assert,
  }) => {
    const rateCard = new RateCard([
      { price: Money.fromPesos(9), minutes: 50 },
      { price: Money.fromPesos(3), minutes: 20 },
    ])

    assert.equal(rateCard.secondsFor(Money.fromPesos(1)), 400)
  })

  test('cannot price coins without any Rate Tier', ({ assert }) => {
    assert.throws(() => new RateCard([]), 'A rate card needs at least one Rate Tier')
  })
})
