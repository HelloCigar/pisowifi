import Setting from '#models/setting'

/**
 * Puts the Machine past its setup wizard, as the wizard leaves it, so the
 * portal serves Customers.
 */
export async function finishSetup() {
  await Setting.createWithDefaults('Aling Nena WiFi')
}
