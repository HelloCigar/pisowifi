import type Credit from '#models/credit'
import TimeSpan from '#time_span/time_span'
import TopUpTransformer from '#transformers/top_up_transformer'
import type { PortalLanguage } from '#values/portal_language'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CreditTransformer extends BaseTransformer<Credit> {
  #language: PortalLanguage

  constructor(resource: Credit, language: PortalLanguage) {
    super(resource)
    this.#language = language
  }

  /**
   * The Credit as the portal shows it to the Device that holds it. Preload
   * `topUps` with only the latest one to show the time it added.
   */
  toObject() {
    const lastTopUp = this.resource.topUps?.[0]
    return {
      timeLeft: {
        raw: this.resource.secondsLeft,
        formatted: new TimeSpan(this.resource.secondsLeft).format(this.#language),
      },
      resumeCode: this.resource.code.format(),
      lastTopUp: lastTopUp ? TopUpTransformer.transform(lastTopUp, this.#language) : null,
    }
  }
}
