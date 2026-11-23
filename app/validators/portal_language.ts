import vine from '@vinejs/vine'
import { PortalLanguage } from '#values/portal_language'

export const updatePortalLanguageValidator = vine.create({
  language: vine.enum(Object.values(PortalLanguage)),
})
