import type { HttpContext } from '@adonisjs/core/http'
import { updatePortalLanguageValidator } from '#validators/portal_language'

/** The language of the portal, which the Customer picks for the visit. */
export default class PortalLanguageController {
  async update({ request, response, session }: HttpContext) {
    const { language } = await request.validateUsing(updatePortalLanguageValidator)

    session.put('portal_language', language)
    return response.redirect().back()
  }
}
