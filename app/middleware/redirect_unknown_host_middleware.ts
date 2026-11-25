import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import portalConfig from '#config/portal'

/**
 * Sends a request for any host other than the portal's to the portal. On
 * the Machine, dnsmasq answers every name a blocked Device looks up with the
 * portal's address, so a Device that opens `http://example.com/` lands here
 * and is redirected. HTTPS is never intercepted: the app does not listen on
 * port 443.
 */
export default class RedirectUnknownHostMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    if (request.hostname() === new URL(portalConfig.url).hostname) {
      return next()
    }

    return response.redirect().withQs(false).toRoute('portal', {}, { prefixUrl: portalConfig.url })
  }
}
