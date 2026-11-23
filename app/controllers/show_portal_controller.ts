import type { HttpContext } from '@adonisjs/core/http'
import DeviceTransformer from '#transformers/device_transformer'

/**
 * The portal's home page for the Device that is browsing.
 */
export default class ShowPortalController {
  async handle({ inertia, device }: HttpContext) {
    return inertia.render('portal/show', {
      device: DeviceTransformer.transform(device),
    })
  }
}
