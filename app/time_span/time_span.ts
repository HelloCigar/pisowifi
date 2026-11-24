import { Duration } from 'luxon'
import type { PortalLanguage } from '#values/portal_language'

/**
 * A span of time in whole seconds, such as the time a Credit has left or
 * the time until a Coin Window closes.
 */
export default class TimeSpan {
  constructor(readonly seconds: number) {
    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new RangeError(`A time span is a whole number of seconds from 0, got ${seconds}`)
    }
  }

  /**
   * The span as a Customer reads it, largest units first and without the
   * units that are zero: `1 oras, 12 minuto` or `1 hour, 12 minutes`.
   */
  format(language: PortalLanguage) {
    const duration =
      this.seconds === 0
        ? Duration.fromObject({ seconds: 0 })
        : Duration.fromObject({ seconds: this.seconds }).rescale()
    return duration.reconfigure({ locale: language }).toHuman({ unitDisplay: 'long' })
  }
}
