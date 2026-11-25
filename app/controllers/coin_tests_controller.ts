import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import HelperClient from '#services/helper_client'
import { LiveChannel } from '#values/live_channel'

/**
 * The setup wizard's Coin Acceptor test. Starting it lets the Coin Acceptor
 * take coins, and the page shows the value of each one, so the Operator
 * knows it is wired and gives one pulse per peso. Stopping it makes the
 * Coin Acceptor reject coins again. Like the wizard, it closes for good
 * once an Operator exists.
 */
@inject()
export default class CoinTestsController {
  constructor(protected helper: HelperClient) {}

  async create({ inertia, response }: HttpContext) {
    if (await User.operatorExists()) {
      return response.redirect().toRoute('admin.session.create')
    }

    const { inhibited } = await this.helper.health()
    return inertia.render('setup/coin_test', {
      testing: !inhibited,
      channel: LiveChannel.CoinTest,
    })
  }

  async store({ response }: HttpContext) {
    if (await User.operatorExists()) {
      return response.redirect().toRoute('admin.session.create')
    }

    await this.helper.setInhibit(false)
    return response.redirect().toRoute('coin_test.create')
  }

  async destroy({ response }: HttpContext) {
    if (await User.operatorExists()) {
      return response.redirect().toRoute('admin.session.create')
    }

    await this.helper.setInhibit(true)
    return response.redirect().toRoute('coin_test.create')
  }
}
