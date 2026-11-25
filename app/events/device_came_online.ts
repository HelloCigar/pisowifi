import { BaseEvent } from '@adonisjs/core/events'

/**
 * The helper saw a Device connect to the Hotspot Network.
 */
export default class DeviceCameOnline extends BaseEvent {
  constructor(
    public macAddress: string,
    public ipAddress: string
  ) {
    super()
  }
}
