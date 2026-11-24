import type { ApplicationService } from '@adonisjs/core/types'
import HelperClient from '#services/helper_client'

/**
 * Binds the helper client and keeps its connection to the privileged helper
 * open while the web server runs.
 */
export default class HelperProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(HelperClient, async (resolver) => {
      const logger = await resolver.make('logger')
      return new HelperClient(
        this.app.config.get<string | undefined>('helper.address'),
        logger.child({ module: 'helper' })
      )
    })
  }

  /**
   * Only the web server talks to the helper. An Ace command, such as a
   * migration, must not send `sync`, or it would change the firewall.
   */
  async ready() {
    if (!['web', 'test'].includes(this.app.getEnvironment())) {
      return
    }

    const client = await this.app.container.make(HelperClient)
    await client.start(async () => {
      const { default: Credit } = await import('#models/credit')
      const { default: Setting } = await import('#models/setting')
      const { default: CoinWindow } = await import('#models/coin_window')
      const settings = await Setting.current()
      if (!settings) {
        return { devices: [], inhibited: true }
      }

      const credits = await Credit.countingDown().preload('device')
      const window = await CoinWindow.open()
      return {
        devices: credits.map((credit) => ({
          mac: credit.device.macAddress,
          ip: credit.device.lastIpAddress,
          speedCap: settings.speedCap,
        })),
        inhibited: !window || window.hasTimedOut,
      }
    })
  }

  async shutdown() {
    const client = await this.app.container.make(HelperClient)
    await client.stop()
  }
}
