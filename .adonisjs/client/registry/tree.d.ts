/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  dashboard: typeof routes['dashboard']
  templates: {
    stats: typeof routes['templates.stats']
    table: {
      index: typeof routes['templates.table.index']
    }
    listDetail: {
      index: typeof routes['templates.list_detail.index']
    }
    notifications: {
      index: typeof routes['templates.notifications.index']
    }
    signup: {
      create: typeof routes['templates.signup.create']
      store: typeof routes['templates.signup.store']
    }
    settingsGeneral: typeof routes['templates.settings_general']
    settingsMembers: {
      index: typeof routes['templates.settings_members.index']
    }
    settingsNotifications: typeof routes['templates.settings_notifications']
    settingsSecurity: typeof routes['templates.settings_security']
  }
}
