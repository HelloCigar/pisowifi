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
 * The portal: the Customer-facing pages, at the root of the Hotspot Network.
 */
router
  .get('/', [controllers.ShowPortal])
  .as('portal')
  .use([middleware.requireSetup(), middleware.device()])
router.put('language', [controllers.PortalLanguage, 'update']).as('portal_language.update')

/**
 * The setup wizard a newly installed Machine boots into. It closes for good
 * once an Operator exists.
 */
router.get('setup', [controllers.Setup, 'create'])
router.post('setup', [controllers.Setup, 'store'])

/**
 * The admin panel: the Operator-facing pages. Every page but the login
 * needs a signed-in Operator.
 */
router
  .group(() => {
    router
      .group(() => {
        router.get('login', [controllers.Session, 'create'])
        router.post('login', [controllers.Session, 'store'])
      })
      .use(middleware.guest())

    router
      .group(() => {
        router.on('/').renderInertia('admin/dashboard', {}).as('dashboard')
        router.post('logout', [controllers.Session, 'destroy'])
        router
          .resource('rate_tiers', controllers.RateTiers)
          .except(['show'])
          .where('id', router.matchers.number())
      })
      .use(middleware.auth())
  })
  .prefix('admin')
  .as('admin')

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

/**
 * The captive catch-all, registered last. Any other path, such as an
 * operating system's connectivity check, is sent to the portal.
 */
router.any('*', [controllers.RedirectToPortal]).as('captive')
