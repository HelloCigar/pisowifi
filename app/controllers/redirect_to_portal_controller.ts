import type { HttpContext } from '@adonisjs/core/http'
import portalConfig from '#config/portal'

/**
 * The captive catch-all. A path the app does not know, such as an operating
 * system's connectivity check (`/generate_204`, `/hotspot-detect.html`,
 * `/connecttest.txt`), is sent to the portal, which makes the phone or
 * laptop open it.
 */
export default class RedirectToPortalController {
  async handle({ response }: HttpContext) {
    return response.redirect().withQs(false).toRoute('portal', {}, { prefixUrl: portalConfig.url })
  }
}
