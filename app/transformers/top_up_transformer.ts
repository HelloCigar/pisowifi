import type TopUp from '#models/top_up'
import TimeSpan from '#time_span/time_span'
import type { PortalLanguage } from '#values/portal_language'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class TopUpTransformer extends BaseTransformer<TopUp> {
  #language: PortalLanguage

  constructor(resource: TopUp, language: PortalLanguage) {
    super(resource)
    this.#language = language
  }

  toObject() {
    return {
      total: {
        raw: this.resource.total.pesos,
        formatted: this.resource.total.format(),
      },
      added: {
        raw: this.resource.secondsAdded,
        formatted: new TimeSpan(this.resource.secondsAdded).format(this.#language),
      },
    }
  }
}
