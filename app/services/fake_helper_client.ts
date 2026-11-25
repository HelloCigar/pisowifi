import logger from '@adonisjs/core/services/logger'
import HelperClient from '#services/helper_client'
import HelperException from '#exceptions/helper_exception'
import type { AllowedDevice, HelperState, SpeedCap } from '#types/helper'

/**
 * A working, in-memory stand-in for the privileged helper, for tests. It
 * follows the contract in helper/PROTOCOL.md that the helper's Go tests check:
 * every Device stays blocked until the first `sync`, a blocked Device has no
 * speed cap, and an IP address no Device holds is unknown.
 */
export default class FakeHelperClient extends HelperClient {
  /** The Devices the fake firewall lets through, by MAC address. */
  allowed = new Map<string, AllowedDevice>()

  /** The Devices of the last `sync`, or null before the first one. */
  lastSync: AllowedDevice[] | null = null

  /**
   * Whether the Coin Acceptor's inhibit line is on. It is on from startup, so
   * the Coin Acceptor rejects coins until the app turns it off.
   */
  inhibited = true

  /**
   * The fake sends a coin in flight while it turns the inhibit line on, so the
   * app need not wait for it.
   */
  coinSettleMs = 0

  #macsByIp = new Map<string, string>()
  #down = false
  #coinsInFlight: number[] = []

  constructor() {
    super(undefined, logger)
  }

  /**
   * Stops the fake helper, as when the helper process crashes. Every request
   * then fails as it does while the real client has no connection.
   */
  goDown() {
    this.#down = true
  }

  /**
   * Puts a Device on the fake Hotspot Network at `ip`, as the DHCP leases
   * would.
   */
  mapIp(ip: string, mac: string) {
    this.#macsByIp.set(this.#normalizeIp(ip), this.#normalizeMac(mac))
  }

  /** Sends `device_online`, as the helper does when a Device connects. */
  async sendDeviceOnline(mac: string, ip: string) {
    await this.deliver({
      event: 'device_online',
      data: { mac: this.#normalizeMac(mac), ip },
    })
  }

  /** Sends `device_offline`, as the helper does when a Device leaves. */
  async sendDeviceOffline(mac: string) {
    await this.deliver({
      event: 'device_offline',
      data: { mac: this.#normalizeMac(mac) },
    })
  }

  /**
   * Sends `coin`, as the helper does when the Coin Acceptor accepts a coin.
   * Like the helper, it sends every coin, whatever the inhibit line says.
   */
  async sendCoin(pesos: number) {
    await this.deliver({ event: 'coin', data: { pesos } })
  }

  /**
   * Drops a coin whose pulse train is still running when the inhibit line next
   * goes on, as when a Customer taps Done right after inserting it. The helper
   * sends its `coin` event after the line is on; the fake sends it as it turns
   * the line on.
   */
  dropCoinInFlight(pesos: number) {
    this.#coinsInFlight.push(pesos)
  }

  /**
   * Sends `sync` and restores the inhibit line, as the real client does when it
   * connects.
   */
  async start(state: () => Promise<HelperState>) {
    await this.restore(await state())
  }

  async stop() {}

  protected async request(method: string, params: any = {}): Promise<unknown> {
    if (this.#down) {
      throw new HelperException('unavailable', 'The helper is not connected')
    }

    switch (method) {
      case 'health':
        return {
          backend: 'fake',
          synced: this.lastSync !== null,
          inhibited: this.inhibited,
        }
      case 'sync':
        return this.#sync(params.devices)
      case 'allow':
        return this.#allow(params)
      case 'block':
        this.allowed.delete(this.#normalizeMac(params.mac))
        return
      case 'set_speed_cap':
        return this.#setSpeedCap(params.mac, params.speed_cap)
      case 'lookup_mac':
        return this.#lookupMac(params.ip)
      case 'set_inhibit':
        return this.#setInhibit(params.on)
      default:
        throw new HelperException('unknown_method', `unknown method ${method}`)
    }
  }

  #sync(devices: any[]) {
    const allowList = devices.map((device) => this.#device(device))
    this.lastSync = allowList
    this.allowed = new Map(allowList.map((device) => [device.mac, device]))
  }

  #allow(params: any) {
    this.#assertSynced()
    const device = this.#device(params)
    this.allowed.set(device.mac, device)
  }

  #setSpeedCap(mac: string, speedCap: any) {
    this.#assertSynced()
    const device = this.allowed.get(this.#normalizeMac(mac))
    if (!device) {
      throw new HelperException('not_allowed', `Device ${mac} is blocked`)
    }
    device.speedCap = this.#speedCap(speedCap)
  }

  async #setInhibit(on: unknown) {
    if (typeof on !== 'boolean') {
      throw new HelperException('bad_request', 'on must be a boolean')
    }
    if (!on) {
      this.#assertSynced()
    }
    this.inhibited = on
    if (!on) {
      return
    }

    const inFlight = this.#coinsInFlight
    this.#coinsInFlight = []
    for (const pesos of inFlight) {
      await this.sendCoin(pesos)
    }
  }

  #lookupMac(ip: string) {
    const mac = this.#macsByIp.get(this.#normalizeIp(ip))
    if (!mac) {
      throw new HelperException('unknown_ip', `no Device holds ${ip}`)
    }
    return { mac }
  }

  #assertSynced() {
    if (this.lastSync === null) {
      throw new HelperException('not_synced', 'every Device stays blocked until the first sync')
    }
  }

  #device(wire: any): AllowedDevice {
    return {
      mac: this.#normalizeMac(wire.mac),
      ip: wire.ip,
      speedCap: this.#speedCap(wire.speed_cap),
    }
  }

  #speedCap(wire: any): SpeedCap {
    return { downKbps: wire.down_kbps, upKbps: wire.up_kbps }
  }

  /** The helper sends MAC addresses lower-case and colon-separated. */
  #normalizeMac(mac: string) {
    return mac.toLowerCase().replaceAll('-', ':')
  }

  /**
   * The helper reads an IPv4 address mapped into IPv6 as plain IPv4, as Go's
   * net.ParseIP does.
   */
  #normalizeIp(ip: string) {
    return ip.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, '')
  }
}
