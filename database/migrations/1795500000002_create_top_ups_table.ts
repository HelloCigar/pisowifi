import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * All the coins from one Coin Window, priced together against the Rate
 * Tiers and added to a Credit.
 */
export default class extends BaseSchema {
  protected tableName = 'top_ups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('credit_id')
        .unsigned()
        .notNullable()
        .references('credits.id')
        .onDelete('CASCADE')
      table.integer('total_centavos').unsigned().notNullable()
      table.integer('seconds_added').unsigned().notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
