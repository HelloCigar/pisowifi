import '@adonisjs/inertia/types'

import type { VNodeProps, AllowedComponentProps, ComponentInstance } from 'vue'

type ExtractProps<T> = Omit<
  ComponentInstance<T>['$props'],
  keyof VNodeProps | keyof AllowedComponentProps
>

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'admin/dashboard': ExtractProps<(typeof import('../../inertia/pages/admin/dashboard.vue'))['default']>
    'admin/rate_tiers/create': ExtractProps<(typeof import('../../inertia/pages/admin/rate_tiers/create.vue'))['default']>
    'admin/rate_tiers/edit': ExtractProps<(typeof import('../../inertia/pages/admin/rate_tiers/edit.vue'))['default']>
    'admin/rate_tiers/index': ExtractProps<(typeof import('../../inertia/pages/admin/rate_tiers/index.vue'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.vue'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.vue'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.vue'))['default']>
    'portal/not_ready': ExtractProps<(typeof import('../../inertia/pages/portal/not_ready.vue'))['default']>
    'portal/show': ExtractProps<(typeof import('../../inertia/pages/portal/show.vue'))['default']>
    'portal/unknown_device': ExtractProps<(typeof import('../../inertia/pages/portal/unknown_device.vue'))['default']>
    'setup/coin_test': ExtractProps<(typeof import('../../inertia/pages/setup/coin_test.vue'))['default']>
    'setup/create': ExtractProps<(typeof import('../../inertia/pages/setup/create.vue'))['default']>
    'templates/list_detail': ExtractProps<(typeof import('../../inertia/pages/templates/list_detail.vue'))['default']>
    'templates/settings_general': ExtractProps<(typeof import('../../inertia/pages/templates/settings_general.vue'))['default']>
    'templates/settings_members': ExtractProps<(typeof import('../../inertia/pages/templates/settings_members.vue'))['default']>
    'templates/settings_notifications': ExtractProps<(typeof import('../../inertia/pages/templates/settings_notifications.vue'))['default']>
    'templates/settings_security': ExtractProps<(typeof import('../../inertia/pages/templates/settings_security.vue'))['default']>
    'templates/signup': ExtractProps<(typeof import('../../inertia/pages/templates/signup.vue'))['default']>
    'templates/stats': ExtractProps<(typeof import('../../inertia/pages/templates/stats.vue'))['default']>
    'templates/table': ExtractProps<(typeof import('../../inertia/pages/templates/table.vue'))['default']>
  }
}
