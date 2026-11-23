import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    settings: {
      columns: {
        data: {
          tsType: 'MachineSettings',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#types/settings', typeImports: ['MachineSettings'] }],
        },
      },
    },
  },
} satisfies SchemaRules
