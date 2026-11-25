import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The paid internet time a Customer still has. It is reached through the
 * Device that holds it, never through its MAC address (ADR 0003).
 */
export default class extends BaseSchema {
  protected tableName = 'credits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('resume_code', 6).notNullable().unique()
      /**
       * The Device that holds the Credit, cleared when the Credit ends or
       * moves, so the unique index means "a Device holds at most one Credit".
       */
      table
        .integer('device_id')
        .unsigned()
        .nullable()
        .unique()
        .references('devices.id')
        .onDelete('SET NULL')
      table.tinyint('state').notNullable()
      /**
       * The seconds left as of the last checkpoint. While the Credit counts
       * down, the time since `counting_since` comes off it.
       */
      table.integer('remaining_seconds').unsigned().notNullable()
      table.timestamp('counting_since').nullable()
      table.timestamp('last_top_up_at').notNullable()
      table.timestamp('expires_at').notNullable()
      table.timestamp('ended_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
