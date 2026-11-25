import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { CoinWindowSchema } from '#database/schema'
import Device from '#models/device'
import Coin from '#models/coin'
import Money from '#money/money'

/**
 * A short period in which one Device holds the Coin Acceptor. It is open until
 * it is closed, by the Customer tapping Done or by timing out at `closesAt`.
 * Each coin moves `closesAt` to now plus the Coin Window length.
 */
export default class CoinWindow extends CoinWindowSchema {
  @belongsTo(() => Device)
  declare device: BelongsTo<typeof Device>

  @hasMany(() => Coin)
  declare coins: HasMany<typeof Coin>

  /**
   * The open Coin Window, or null when the Coin Acceptor is free.
   *
   * Global on purpose: a Machine has one Coin Acceptor, so at most one Coin
   * Window is open across every Device.
   */
  static open(options?: { client: TransactionClientContract }) {
    return this.query(options).whereNull('closed_at').first()
  }

  /**
   * The open Coin Windows whose close time has passed.
   *
   * Global on purpose: the scheduled task closes them for every Device.
   */
  static timedOut() {
    const now = DateTime.now().toFormat(db.connection().dialect.dateTimeFormat)
    return this.query().whereNull('closed_at').where('closes_at', '<=', now)
  }

  /**
   * Whether the close time has passed. The window still holds the Coin Acceptor
   * until it is closed, but it takes no more time from new coins.
   */
  get hasTimedOut() {
    return this.closesAt <= DateTime.now()
  }

  /** The money inserted during the window. Preload `coins`. */
  get inserted() {
    return new Money(this.coins.reduce((sum, coin) => sum + coin.amountCentavos, 0))
  }

  /** Whole seconds until the window times out, never below zero. */
  get secondsLeft() {
    return Math.max(0, Math.ceil(this.closesAt.diffNow('seconds').seconds))
  }
}
