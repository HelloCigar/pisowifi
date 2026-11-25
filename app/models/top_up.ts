import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Money from '#money/money'
import { TopUpSchema } from '#database/schema'
import Credit from '#models/credit'
import Coin from '#models/coin'

/**
 * All the coins from one Coin Window, priced together against the Rate Tiers
 * and added to a Credit.
 */
export default class TopUp extends TopUpSchema {
  @belongsTo(() => Credit)
  declare credit: BelongsTo<typeof Credit>

  @hasMany(() => Coin)
  declare coins: HasMany<typeof Coin>

  get total() {
    return new Money(this.totalCentavos)
  }
}
