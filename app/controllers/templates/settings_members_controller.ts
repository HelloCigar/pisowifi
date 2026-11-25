import DemoMembers from '#services/demo/members'
import type { HttpContext } from '@adonisjs/core/http'

export default class SettingsMembersController {
  async index({ inertia }: HttpContext) {
    return inertia.render('templates/settings_members', { members: new DemoMembers().all() })
  }
}
