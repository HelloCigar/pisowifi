import { DateTime } from 'luxon'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { CreditSchema } from '#database/schema'
import { CreditState } from '#values/credit_state'
import ResumeCode from '#resume_code/resume_code'
import Device from '#models/device'
import TopUp from '#models/top_up'

/**
 * The paid internet time a Customer still has. A Device holds at most one
 * Credit, and the Credit is reached through that Device or its Resume Code,
 * never through a MAC address (ADR 0003).
 *
 * The time left is not written every second: `remainingSeconds` is the time
 * left as of the last checkpoint, and while the Credit counts down the time
 * since `countingSince` comes off it.
 */
export default class Credit extends CreditSchema {
  @belongsTo(() => Device)
  declare device: BelongsTo<typeof Device>

  @hasMany(() => TopUp)
  declare topUps: HasMany<typeof TopUp>

  /**
   * The Credit the Device holds, or null.
   */
  static heldBy(device: Device, options?: { client: TransactionClientContract }) {
    return this.query(options).where('device_id', device.id).first()
  }

  /**
   * The Credits counting down, each held by a Device that is online on it.
   *
   * Global on purpose: the helper's allow list covers every Device.
   */
  static countingDown() {
    return this.query().where('state', CreditState.Counting).whereNotNull('device_id')
  }

  /**
   * Gives the Device a new Credit with no time yet and a new Resume Code.
   * It counts down from now, so a Top-up added to it starts it.
   */
  static async issue(device: Device, options: { client: TransactionClientContract }) {
    const now = DateTime.now()
    const resumeCode = await this.#unusedResumeCode(options)
    return this.create(
      {
        resumeCode: resumeCode.value,
        deviceId: device.id,
        state: CreditState.Counting,
        remainingSeconds: 0,
        countingSince: now,
        lastTopUpAt: now,
        expiresAt: now,
      },
      options
    )
  }

  /**
   * A Resume Code no Credit has ever had. Codes are never reused, and a
   * collision in 887 million codes is rare, so trying again is enough.
   */
  static async #unusedResumeCode(options: { client: TransactionClientContract }) {
    while (true) {
      const code = ResumeCode.generate()
      // Global on purpose: a Resume Code is unique across every Credit.
      const taken = await this.query(options).where('resume_code', code.value).first()
      if (!taken) {
        return code
      }
    }
  }

  get code() {
    return new ResumeCode(this.resumeCode)
  }

  /**
   * The whole seconds left now, never below zero.
   */
  get secondsLeft() {
    if (this.state !== CreditState.Counting || !this.countingSince) {
      return this.remainingSeconds
    }
    const counted = Math.floor(DateTime.now().diff(this.countingSince, 'seconds').seconds)
    return Math.max(0, this.remainingSeconds - counted)
  }

  /**
   * Adds the time of a Top-up and pushes the Expiry back to `expiryDays`
   * from now. The time left so far is checkpointed first, so the countdown
   * carries on from now.
   */
  async addTopUp(
    this: Credit,
    topUp: { totalCentavos: number; secondsAdded: number },
    expiryDays: number
  ) {
    const now = DateTime.now()
    this.remainingSeconds = this.secondsLeft + topUp.secondsAdded
    if (this.state === CreditState.Counting) {
      this.countingSince = now
    }
    this.lastTopUpAt = now
    this.expiresAt = now.plus({ days: expiryDays })
    await this.save()

    return this.related('topUps').create(topUp)
  }
}
