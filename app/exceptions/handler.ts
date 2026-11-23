import app from '@adonisjs/core/services/app'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { inertia }) => inertia.render('errors/not_found', {}),
    '500..599': (_, { inertia }) => inertia.render('errors/server_error', {}),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    /**
     * A wrong email or password shows under the login form's email field,
     * not as a toast.
     */
    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      ctx.session.flashExcept(['_csrf', '_method', 'password'])
      ctx.session.flashInputErrors({ email: error.getResponseMessage(error, ctx) })
      return ctx.response.redirect().back()
    }

    /**
     * The limiter answers with a plain-text 429, which an Inertia form
     * cannot show. Send the visitor back to the form with the message
     * instead.
     */
    if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS && ctx.request.header('x-inertia')) {
      const minutes = Math.ceil(error.response.availableIn / 60)
      ctx.session.flash(
        'error',
        `Too many attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`
      )
      return ctx.response.redirect().back()
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
