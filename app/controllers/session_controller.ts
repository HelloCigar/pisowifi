import User from '#models/user'
import { loginValidator } from '#validators/user'
import limiter from '@adonisjs/limiter/services/main'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * The Operator's session in the admin panel: logging in and out.
 */
export default class SessionController {
  async create({ inertia, response }: HttpContext) {
    if (!(await User.operatorExists())) {
      return response.redirect().toRoute('setup.create')
    }

    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    /**
     * Customers share the Hotspot Network with the admin panel, so failed
     * logins are limited per IP address and per IP address and email. Only
     * failures count, and a successful login clears both.
     */
    const ip = request.ip()
    const loginLimiter = limiter.multi([
      { key: `admin_login_ip_${ip}`, requests: 10, duration: '15 minutes' },
      {
        key: `admin_login_ip_email_${ip}_${email.toLowerCase()}`,
        requests: 5,
        duration: '15 minutes',
        blockDuration: '15 minutes',
      },
    ])

    const [limitError, user] = await loginLimiter.penalize(() => {
      return User.verifyCredentials(email, password)
    })

    if (limitError) {
      throw limitError
    }

    await auth.use('web').login(user)
    return response.redirect().toRoute('admin.dashboard')
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('admin.session.create')
  }
}
