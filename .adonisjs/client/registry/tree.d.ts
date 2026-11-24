/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  portal: typeof routes['portal']
  coinWindow: {
    store: typeof routes['coin_window.store']
    destroy: typeof routes['coin_window.destroy']
  }
  portalLanguage: {
    update: typeof routes['portal_language.update']
  }
  setup: {
    create: typeof routes['setup.create']
    store: typeof routes['setup.store']
  }
  coinTest: {
    create: typeof routes['coin_test.create']
    store: typeof routes['coin_test.store']
    destroy: typeof routes['coin_test.destroy']
  }
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
  admin: {
    session: {
      create: typeof routes['admin.session.create']
      store: typeof routes['admin.session.store']
      destroy: typeof routes['admin.session.destroy']
    }
    dashboard: typeof routes['admin.dashboard']
    rateTiers: {
      index: typeof routes['admin.rate_tiers.index']
      create: typeof routes['admin.rate_tiers.create']
      store: typeof routes['admin.rate_tiers.store']
      edit: typeof routes['admin.rate_tiers.edit']
      update: typeof routes['admin.rate_tiers.update']
      destroy: typeof routes['admin.rate_tiers.destroy']
    }
  }
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
  captive: typeof routes['captive']
}
