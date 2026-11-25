import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The Machine's settings: one row, which the setup wizard creates. The app
 * reads and writes its values as a whole, so they live in one typed JSON column
 * (see `MachineSettings` in types/settings.ts).
 */
export default class extends BaseSchema {
  protected tableName = 'settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.json('data').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
