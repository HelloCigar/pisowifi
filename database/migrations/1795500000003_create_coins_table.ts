import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Each coin the Coin Acceptor accepted. A coin with no Coin Window and no
 * Top-up is an Orphan Coin.
 */
export default class extends BaseSchema {
  protected tableName = 'coins'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('amount_centavos').unsigned().notNullable()
      table.timestamp('received_at').notNullable()
      table
        .integer('coin_window_id')
        .unsigned()
        .nullable()
        .references('coin_windows.id')
        .onDelete('SET NULL')
      table.integer('top_up_id').unsigned().nullable().references('top_ups.id').onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
