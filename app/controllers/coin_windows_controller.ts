import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import CoinWindow from '#models/coin_window'
import CoinWindowService from '#services/coin_window_service'

/**
 * The Coin Window of the browsing Device: Insert Coin opens it, and Done closes
 * it. Opening and closing are its whole life.
 */
@inject()
export default class CoinWindowsController {
  constructor(protected coinWindows: CoinWindowService) {}

  async store({ device, response }: HttpContext) {
    await this.coinWindows.open(device)
    return response.redirect().toRoute('portal')
  }

  async destroy({ device, response }: HttpContext) {
    const window = await CoinWindow.open()
    if (!window || window.deviceId !== device.id) {
      return response.redirect().toRoute('portal')
    }

    await this.coinWindows.close(window)
    return response.redirect().toRoute('portal')
  }
}
