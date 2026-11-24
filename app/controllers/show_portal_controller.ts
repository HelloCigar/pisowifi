import type { HttpContext } from '@adonisjs/core/http'
import Credit from '#models/credit'
import Device from '#models/device'
import CoinWindow from '#models/coin_window'
import DeviceTransformer from '#transformers/device_transformer'
import CreditTransformer from '#transformers/credit_transformer'
import CoinWindowTransformer from '#transformers/coin_window_transformer'
import { PortalLanguage } from '#values/portal_language'
import { LiveChannel } from '#values/live_channel'

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

    // A window past its close time no longer keeps other Devices waiting,
    // even before the scheduled task closes it. Its holder still sees it
    // until it is closed and the coins are credited.
    const open = await CoinWindow.open()
    const holdsWindow = open?.deviceId === device.id
    const window = open && (holdsWindow || !open.hasTimedOut) ? open : null
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
      coinWindowChannel: Device.coinWindowChannel(device.id),
      coinAcceptorChannel: LiveChannel.CoinAcceptor,
    })
  }
}
