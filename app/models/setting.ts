import { column } from '@adonisjs/lucid/orm'
import { SettingSchema } from '#database/schema'
import type { MachineSettings } from '#types/settings'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * The Machine's settings. There is one row, and setup is finished once it
 * exists: the setup wizard creates it together with the Operator.
 */
export default class Setting extends SettingSchema {
  @column({
    prepare: (value: MachineSettings) => JSON.stringify(value),
    consume: (value: string | MachineSettings) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare data: MachineSettings

  /**
   * The settings row, or null while the Machine is not set up.
   *
   * Global on purpose: one Machine has one settings row.
   */
  static current() {
    return this.first()
  }

  /**
   * Creates the settings row with the defaults the Operator can change
   * later.
   */
  static createWithDefaults(hotspotName: string, options?: { client: TransactionClientContract }) {
    return this.create(
      {
        data: {
          hotspotName,
          coinWindowSeconds: 60,
          autoPauseMinutes: 5,
          expiryDays: 7,
          speedCapDownMbps: 5,
          speedCapUpMbps: 2,
        },
      },
      options
    )
  }
}
