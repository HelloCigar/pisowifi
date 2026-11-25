import DemoMails from '#services/demo/mails'
import type { HttpContext } from '@adonisjs/core/http'

export default class ListDetailController {
  async index({ inertia }: HttpContext) {
    return inertia.render('templates/list_detail', {
      mails: new DemoMails().all(),
    })
  }
}
