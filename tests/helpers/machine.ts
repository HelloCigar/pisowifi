import Setting from '#models/setting'
import RateTier from '#models/rate_tier'

/**
 * Puts the Machine past its setup wizard, as the wizard leaves it, so the
 * portal serves Customers: the default settings and one Rate Tier of ₱5 for
 * 60 minutes.
 */
export async function finishSetup() {
  await Setting.createWithDefaults('Aling Nena WiFi')
  await RateTier.create({ priceCentavos: 500, minutes: 60 })
}
