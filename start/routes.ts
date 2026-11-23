/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'

/**
 * Send visitors to the dashboard when logged in, or to the login page otherwise
 */
router
  .get('/', async ({ auth, response }) => {
    return (await auth.check())
      ? response.redirect().toRoute('dashboard')
      : response.redirect().toRoute('session.create')
  })
  .as('home')

router
  .group(() => {
    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.on('dashboard').renderInertia('dashboard', {}).as('dashboard')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

/**
 * Layout templates from the starter kit, kept as working pages to copy
 * from. They exist only outside production. See docs/templates.md.
 * The signup template is also how a developer creates a user locally.
 */
if (!app.inProduction) {
  router
    .group(() => {
      router.on('stats').renderInertia('templates/stats', {}).as('stats')
      router.get('table', [controllers.templates.Table, 'index'])
      router.get('list_detail', [controllers.templates.ListDetail, 'index'])
      router.get('notifications', [controllers.templates.Notifications, 'index'])
      router.get('signup', [controllers.templates.Signup, 'create'])
      router.post('signup', [controllers.templates.Signup, 'store'])

      router.on('settings').renderInertia('templates/settings_general', {}).as('settings_general')
      router.get('settings/members', [controllers.templates.SettingsMembers, 'index'])
      router
        .on('settings/notifications')
        .renderInertia('templates/settings_notifications', {})
        .as('settings_notifications')
      router
        .on('settings/security')
        .renderInertia('templates/settings_security', {})
        .as('settings_security')
    })
    .prefix('_templates')
    .as('templates')
}
