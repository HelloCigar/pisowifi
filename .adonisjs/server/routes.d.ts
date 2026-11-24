import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'portal': { paramsTuple?: []; params?: {} }
    'coin_window.store': { paramsTuple?: []; params?: {} }
    'coin_window.destroy': { paramsTuple?: []; params?: {} }
    'portal_language.update': { paramsTuple?: []; params?: {} }
    'setup.create': { paramsTuple?: []; params?: {} }
    'setup.store': { paramsTuple?: []; params?: {} }
    'coin_test.create': { paramsTuple?: []; params?: {} }
    'coin_test.store': { paramsTuple?: []; params?: {} }
    'coin_test.destroy': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'admin.session.create': { paramsTuple?: []; params?: {} }
    'admin.session.store': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.session.destroy': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.index': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.create': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.store': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.rate_tiers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.rate_tiers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'templates.stats': { paramsTuple?: []; params?: {} }
    'templates.table.index': { paramsTuple?: []; params?: {} }
    'templates.list_detail.index': { paramsTuple?: []; params?: {} }
    'templates.notifications.index': { paramsTuple?: []; params?: {} }
    'templates.signup.create': { paramsTuple?: []; params?: {} }
    'templates.signup.store': { paramsTuple?: []; params?: {} }
    'templates.settings_general': { paramsTuple?: []; params?: {} }
    'templates.settings_members.index': { paramsTuple?: []; params?: {} }
    'templates.settings_notifications': { paramsTuple?: []; params?: {} }
    'templates.settings_security': { paramsTuple?: []; params?: {} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  GET: {
    'portal': { paramsTuple?: []; params?: {} }
    'setup.create': { paramsTuple?: []; params?: {} }
    'coin_test.create': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'admin.session.create': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.index': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.create': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'templates.stats': { paramsTuple?: []; params?: {} }
    'templates.table.index': { paramsTuple?: []; params?: {} }
    'templates.list_detail.index': { paramsTuple?: []; params?: {} }
    'templates.notifications.index': { paramsTuple?: []; params?: {} }
    'templates.signup.create': { paramsTuple?: []; params?: {} }
    'templates.settings_general': { paramsTuple?: []; params?: {} }
    'templates.settings_members.index': { paramsTuple?: []; params?: {} }
    'templates.settings_notifications': { paramsTuple?: []; params?: {} }
    'templates.settings_security': { paramsTuple?: []; params?: {} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  HEAD: {
    'portal': { paramsTuple?: []; params?: {} }
    'setup.create': { paramsTuple?: []; params?: {} }
    'coin_test.create': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'admin.session.create': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.index': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.create': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'templates.stats': { paramsTuple?: []; params?: {} }
    'templates.table.index': { paramsTuple?: []; params?: {} }
    'templates.list_detail.index': { paramsTuple?: []; params?: {} }
    'templates.notifications.index': { paramsTuple?: []; params?: {} }
    'templates.signup.create': { paramsTuple?: []; params?: {} }
    'templates.settings_general': { paramsTuple?: []; params?: {} }
    'templates.settings_members.index': { paramsTuple?: []; params?: {} }
    'templates.settings_notifications': { paramsTuple?: []; params?: {} }
    'templates.settings_security': { paramsTuple?: []; params?: {} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  POST: {
    'coin_window.store': { paramsTuple?: []; params?: {} }
    'setup.store': { paramsTuple?: []; params?: {} }
    'coin_test.store': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'admin.session.store': { paramsTuple?: []; params?: {} }
    'admin.session.destroy': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.store': { paramsTuple?: []; params?: {} }
    'templates.signup.store': { paramsTuple?: []; params?: {} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  DELETE: {
    'coin_window.destroy': { paramsTuple?: []; params?: {} }
    'coin_test.destroy': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  PUT: {
    'portal_language.update': { paramsTuple?: []; params?: {} }
    'admin.rate_tiers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  PATCH: {
    'admin.rate_tiers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  OPTIONS: {
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}