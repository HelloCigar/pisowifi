import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'portal': { paramsTuple?: []; params?: {} }
    'portal_language.update': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
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
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
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
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
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
  PUT: {
    'portal_language.update': { paramsTuple?: []; params?: {} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'templates.signup.store': { paramsTuple?: []; params?: {} }
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  OPTIONS: {
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  PATCH: {
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
  DELETE: {
    'captive': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}