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
    credits: {
      columns: {
        state: {
          tsType: 'CreditState',
          decorators: [{ name: '@column' }],
          imports: [{ source: '#values/credit_state', typeImports: ['CreditState'] }],
        },
      },
    },
  },
} satisfies SchemaRules
