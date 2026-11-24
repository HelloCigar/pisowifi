import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Money from '#money/money'
import { CoinSchema } from '#database/schema'
import CoinWindow from '#models/coin_window'
import TopUp from '#models/top_up'

/**
 * A coin the Coin Acceptor accepted. A coin with no Coin Window and no
 * Top-up is an Orphan Coin.
 */
export default class Coin extends CoinSchema {
  @belongsTo(() => CoinWindow)
  declare coinWindow: BelongsTo<typeof CoinWindow>

  @belongsTo(() => TopUp)
  declare topUp: BelongsTo<typeof TopUp>

  get amount() {
    return new Money(this.amountCentavos)
  }
}
