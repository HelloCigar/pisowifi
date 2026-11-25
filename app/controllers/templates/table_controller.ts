import DemoCustomers from '#services/demo/customers'
import type { HttpContext } from '@adonisjs/core/http'

export default class TableController {
  async index({ inertia }: HttpContext) {
    return inertia.render('templates/table', { customers: new DemoCustomers().all() })
  }
}
