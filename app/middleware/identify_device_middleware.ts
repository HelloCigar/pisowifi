import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Device from '#models/device'
import HelperClient from '#services/helper_client'
import UnknownDeviceException from '#exceptions/unknown_device_exception'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    device: Device
  }
}

/**
 * Finds out which Device is browsing the portal. The helper gives the MAC
 * address behind the request's IP address, from the DHCP leases or the ARP
 * table, and the sighting is recorded on the Device.
 *
 * The Device is the segregation key of the portal: every read and write of
 * the portal reaches its records through `ctx.device`.
 */
@inject()
export default class IdentifyDeviceMiddleware {
  constructor(protected helper: HelperClient) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const ip = ctx.request.ip()
    const mac = await this.helper.lookupMac(ip)
    if (!mac) {
      throw new UnknownDeviceException()
    }

    ctx.device = await Device.recordSighting(mac, ip)
    return next()
  }
}
