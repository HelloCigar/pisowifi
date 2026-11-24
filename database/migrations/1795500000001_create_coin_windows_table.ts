import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The periods in which one Device holds the Coin Acceptor. A window is open
 * until `closed_at` is set; `closes_at` is when it times out.
 */
export default class extends BaseSchema {
  protected tableName = 'coin_windows'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('device_id')
        .unsigned()
        .notNullable()
        .references('devices.id')
        .onDelete('CASCADE')
      table.timestamp('opened_at').notNullable()
      table.timestamp('closes_at').notNullable()
      table.timestamp('closed_at').nullable().index()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
