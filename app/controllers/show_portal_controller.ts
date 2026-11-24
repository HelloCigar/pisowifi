import type { HttpContext } from '@adonisjs/core/http'
import Credit from '#models/credit'
import CoinWindow from '#models/coin_window'
import DeviceTransformer from '#transformers/device_transformer'
import CreditTransformer from '#transformers/credit_transformer'
import CoinWindowTransformer from '#transformers/coin_window_transformer'
import { PortalLanguage } from '#values/portal_language'

/**
 * The portal's home page for the Device that is browsing: its Credit, its
 * Coin Window, or who holds the Coin Acceptor.
 */
export default class ShowPortalController {
  async handle({ inertia, device, session }: HttpContext) {
    const language: PortalLanguage = session.get('portal_language', PortalLanguage.Filipino)
    const credit = await Credit.query()
      .where('device_id', device.id)
      .preload('topUps', (query) => query.orderBy('id', 'desc').limit(1))
      .first()

    // A window past its close time no longer holds the Coin Acceptor for
    // anyone, even before the scheduled task closes it.
    const open = await CoinWindow.open()
    const window = open && !open.hasTimedOut ? open : null
    const holdsWindow = window?.deviceId === device.id
    if (window && holdsWindow) {
      await window.load('coins')
    }

    return inertia.render('portal/show', {
      device: DeviceTransformer.transform(device),
      credit: credit ? CreditTransformer.transform(credit, language) : null,
      coinWindow:
        window && holdsWindow
          ? CoinWindowTransformer.transform(window, language).useVariant('forHolder')
          : null,
      coinAcceptorBusy:
        window && !holdsWindow ? CoinWindowTransformer.transform(window, language) : null,
    })
  }
}
