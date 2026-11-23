import { configApp } from '@adonisjs/eslint-config'
import { vue } from '@adonisjs/eslint-config/vue'
import { astGrep } from '@adonisjs/eslint-ast-grep'

export default configApp(
  ...astGrep('@adonisplus/flow/rules'),
  ...vue,
  {
    name: 'inertia-vue ts overrides',
    files: ['inertia/**/*.ts'],
    rules: {
      'vue/component-api-style': 'off',
    },
  },
  {
    name: 'nuxt ui generated declarations',
    ignores: ['inertia/auto-imports.d.ts', 'inertia/components.d.ts'],
  }
)
