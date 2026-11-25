/**
 * The values of the Machine's settings row. The Operator can change each one;
 * the setup wizard sets the hotspot name and the defaults.
 */
export type MachineSettings = {
  hotspotName: string
  /** How long a Coin Window stays open after it opens or after its last coin. */
  coinWindowSeconds: number
  /** How long a Device can be offline before its Credit pauses by itself. */
  autoPauseMinutes: number
  /** How many days a Credit lasts after its last Top-up. */
  expiryDays: number
  /** The speed cap of each Device, in megabits per second. */
  speedCapDownMbps: number
  speedCapUpMbps: number
}
