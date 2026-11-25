import Device from '#models/device'
import type DeviceCameOnline from '#events/device_came_online'

/**
 * Records a Device that connects to the Hotspot Network, with its IP
 * address and the time it was seen.
 */
export default class RecordDeviceSighting {
  async handle(event: DeviceCameOnline) {
    await Device.recordSighting(event.macAddress, event.ipAddress)
  }
}
