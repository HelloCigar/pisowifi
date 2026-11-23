 
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'portal': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['portal']['types'],
  },
  'portal_language.update': {
    methods: ["PUT"],
    pattern: '/language',
    tokens: [[0,"language"]],
    types: placeholder as Registry['portal_language.update']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [[0,"dashboard"]],
    types: placeholder as Registry['dashboard']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'templates.stats': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/stats',
    tokens: [[0,"_templates"],[0,"stats"]],
    types: placeholder as Registry['templates.stats']['types'],
  },
  'templates.table.index': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/table',
    tokens: [[0,"_templates"],[0,"table"]],
    types: placeholder as Registry['templates.table.index']['types'],
  },
  'templates.list_detail.index': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/list_detail',
    tokens: [[0,"_templates"],[0,"list_detail"]],
    types: placeholder as Registry['templates.list_detail.index']['types'],
  },
  'templates.notifications.index': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/notifications',
    tokens: [[0,"_templates"],[0,"notifications"]],
    types: placeholder as Registry['templates.notifications.index']['types'],
  },
  'templates.signup.create': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/signup',
    tokens: [[0,"_templates"],[0,"signup"]],
    types: placeholder as Registry['templates.signup.create']['types'],
  },
  'templates.signup.store': {
    methods: ["POST"],
    pattern: '/_templates/signup',
    tokens: [[0,"_templates"],[0,"signup"]],
    types: placeholder as Registry['templates.signup.store']['types'],
  },
  'templates.settings_general': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/settings',
    tokens: [[0,"_templates"],[0,"settings"]],
    types: placeholder as Registry['templates.settings_general']['types'],
  },
  'templates.settings_members.index': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/settings/members',
    tokens: [[0,"_templates"],[0,"settings"],[0,"members"]],
    types: placeholder as Registry['templates.settings_members.index']['types'],
  },
  'templates.settings_notifications': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/settings/notifications',
    tokens: [[0,"_templates"],[0,"settings"],[0,"notifications"]],
    types: placeholder as Registry['templates.settings_notifications']['types'],
  },
  'templates.settings_security': {
    methods: ["GET","HEAD"],
    pattern: '/_templates/settings/security',
    tokens: [[0,"_templates"],[0,"settings"],[0,"security"]],
    types: placeholder as Registry['templates.settings_security']['types'],
  },
  'captive': {
    methods: ["HEAD","OPTIONS","GET","POST","PUT","PATCH","DELETE"],
    pattern: '/*',
    tokens: [[2,"*"]],
    types: placeholder as Registry['captive']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
