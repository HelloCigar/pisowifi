import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { DeviceSchema } from '#database/schema'

export default class Device extends DeviceSchema {
  /**
   * Records that the Device with this MAC address was seen at this IP
   * address just now, and returns it. The first sighting creates it.
   *
   * The MAC address comes from the helper, never from a request, so this
   * touch has no scope: the MAC address is what identifies the Device.
   */
  static async recordSighting(macAddress: string, ipAddress: string) {
    // flow-allow models.md: updateOrCreate selects and then inserts, so two first requests
    // from one Device race on the unique MAC address; query-builder.md's onConflict upsert is atomic.
    const now = DateTime.now().toFormat(db.connection().dialect.dateTimeFormat)
    await db
      .table('devices')
      .insert({
        mac_address: macAddress,
        last_ip_address: ipAddress,
        last_seen_at: now,
        created_at: now,
        updated_at: now,
      })
      .onConflict('mac_address')
      .merge(['last_ip_address', 'last_seen_at', 'updated_at'])

    return this.findByOrFail('macAddress', macAddress)
  }
}
