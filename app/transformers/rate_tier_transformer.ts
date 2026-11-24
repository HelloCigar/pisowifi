import type RateTier from '#models/rate_tier'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RateTierTransformer extends BaseTransformer<RateTier> {
  toObject() {
    const hours = Math.floor(this.resource.minutes / 60)
    const minutes = this.resource.minutes % 60
    const time = [
      hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '',
      minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : '',
    ]

    return {
      id: this.resource.id,
      price: {
        raw: this.resource.price.pesos,
        formatted: this.resource.price.format(),
      },
      minutes: {
        raw: this.resource.minutes,
        formatted: time.filter(Boolean).join(' '),
      },
    }
  }
}
