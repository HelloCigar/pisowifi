/*
|--------------------------------------------------------------------------
| Transmit channels
|--------------------------------------------------------------------------
|
| Who may subscribe to each private channel. A channel with no rule here is
| public.
|
*/

import app from '@adonisjs/core/services/app'
import transmit from '@adonisjs/transmit/services/main'
import User from '#models/user'
import Device from '#models/device'
import HelperClient from '#services/helper_client'
import { LiveChannel } from '#values/live_channel'

/**
 * A Device's Coin Window. The subscribing Device is the one behind the
 * request's IP address, as on the portal, and it may only listen to its own
 * window.
 */
transmit.authorize<{ deviceId: string }>(
  'devices/:deviceId/coin_window',
  async (ctx, { deviceId }) => {
    const helper = await app.container.make(HelperClient)
    const mac = await helper.lookupMac(ctx.request.ip())
    if (!mac) {
      return false
    }

    // The MAC address from the helper is the segregation key: an id of
    // another Device is not found.
    const device = await Device.query()
      .where('id', Number(deviceId))
      .where('mac_address', mac)
      .first()
    return device !== null
  }
)

/**
 * The setup wizard's coin test, open like the wizard itself only while the
 * Machine has no Operator.
 */
transmit.authorize(LiveChannel.CoinTest, async () => !(await User.operatorExists()))
