import { BaseEvent } from '@adonisjs/core/events'

/**
 * The helper saw a Device leave the Hotspot Network.
 */
export default class DeviceWentOffline extends BaseEvent {
  constructor(public macAddress: string) {
    super()
  }
}
