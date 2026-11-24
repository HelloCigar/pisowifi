import net from 'node:net'
import type { Logger } from '@adonisjs/core/logger'
import { events } from '#generated/events'
import HelperException from '#exceptions/helper_exception'
import type {
  AllowedDevice,
  HelperEvent,
  HelperHealth,
  HelperReply,
  HelperState,
  PendingHelperRequest,
  SpeedCap,
} from '#types/helper'

/**
 * The only part of the app that talks to the privileged helper (ADR 0002).
 * It keeps one connection open to the helper's socket, speaks the protocol
 * in helper/PROTOCOL.md, and reconnects when the connection drops. Each
 * time it connects it sends `sync` and restores the inhibit line, because
 * the helper may have restarted and then blocks every Device and rejects
 * every coin.
 *
 * Tests swap it for FakeHelperClient, which keeps the helper's state in
 * memory.
 */
// flow-allow services.md: the spec names this the helper client; it wraps an outside
// process like testing.md's PaymentGateway, rather than a domain process.
export default class HelperClient {
  /**
   * How long a request waits for its reply.
   */
  static requestTimeoutMs = 5000

  /**
   * How long to wait before connecting again after the connection drops.
   */
  static reconnectDelayMs = 2000

  /**
   * How long a coin can still arrive after the inhibit line goes on. A coin
   * the Coin Acceptor took just before is still sending its pulse train,
   * about a second for ₱20, and the helper waits 250 ms of quiet after the
   * last pulse before it sends the `coin` event.
   */
  coinSettleMs = 1500

  #address: string | undefined
  #logger: Logger
  #state: () => Promise<HelperState> = async () => ({ devices: [], inhibited: true })
  #socket: net.Socket | undefined
  #connected = false
  #stopped = true
  #reconnectTimer: NodeJS.Timeout | undefined
  #buffer = ''
  #nextId = 1
  #pending = new Map<number, PendingHelperRequest>()

  /**
   * `address` is the path of the helper's Unix socket, or
   * `tcp://127.0.0.1:<port>` for the simulator on a Windows PC, where Node
   * cannot reach a Unix socket.
   */
  constructor(address: string | undefined, logger: Logger) {
    this.#address = address
    this.#logger = logger
  }

  /**
   * Opens the connection and keeps it open until `stop`. `state` gives what
   * to send the helper each time the client connects.
   */
  async start(state: () => Promise<HelperState>) {
    this.#state = state
    if (!this.#address) {
      this.#logger.warn('HELPER_ADDRESS is not set, so the portal cannot identify Devices')
      return
    }

    this.#stopped = false
    this.#connect(this.#address)
  }

  async stop() {
    this.#stopped = true
    clearTimeout(this.#reconnectTimer)
    this.#socket?.destroy()
  }

  async health(): Promise<HelperHealth> {
    return (await this.request('health')) as HelperHealth
  }

  /**
   * Replaces the whole allow list. Every Device not listed is blocked.
   */
  async sync(devices: AllowedDevice[]) {
    await this.request('sync', { devices: devices.map((device) => this.#wireDevice(device)) })
  }

  async allow(device: AllowedDevice) {
    await this.request('allow', this.#wireDevice(device))
  }

  async block(mac: string) {
    await this.request('block', { mac })
  }

  async setSpeedCap(mac: string, speedCap: SpeedCap) {
    await this.request('set_speed_cap', { mac, speed_cap: this.#wireSpeedCap(speedCap) })
  }

  /**
   * Drives the Coin Acceptor's inhibit line. While it is on, the Coin
   * Acceptor rejects every coin.
   */
  async setInhibit(on: boolean) {
    await this.request('set_inhibit', { on })
  }

  /**
   * The MAC address of the Device that holds `ip`, or null when no Device
   * holds it.
   */
  async lookupMac(ip: string): Promise<string | null> {
    try {
      const result = (await this.request('lookup_mac', { ip })) as { mac: string }
      return result.mac
    } catch (error) {
      if (error instanceof HelperException && error.reason === 'unknown_ip') {
        return null
      }
      throw error
    }
  }

  /**
   * Brings a helper that just started, or restarted, to the app's state:
   * `sync` first, since the inhibit line can only go off after it.
   */
  protected async restore(state: HelperState) {
    await this.sync(state.devices)
    if (!state.inhibited) {
      await this.setInhibit(false)
    }
  }

  /**
   * Sends one request and waits for its reply. A failed reply rejects with
   * a HelperException that carries the protocol's error code.
   */
  protected request(method: string, params?: object): Promise<unknown> {
    const socket = this.#socket
    if (!socket || !this.#connected) {
      return Promise.reject(new HelperException('unavailable', 'The helper is not connected'))
    }

    const id = this.#nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id)
        reject(new HelperException('timeout', `The helper did not answer ${method} in time`))
      }, HelperClient.requestTimeoutMs)

      this.#pending.set(id, { resolve, reject, timer })
      socket.write(JSON.stringify({ id, method, params }) + '\n')
    })
  }

  /**
   * Turns an event from the helper into the app's class event.
   */
  protected async deliver(message: HelperEvent) {
    switch (message.event) {
      case 'device_online':
        return events.DeviceCameOnline.dispatch(message.data.mac, message.data.ip)
      case 'device_offline':
        return events.DeviceWentOffline.dispatch(message.data.mac)
      case 'coin':
        return events.CoinAccepted.dispatch(message.data.pesos)
    }
  }

  #connect(address: string) {
    const socket = address.startsWith('tcp://')
      ? net.createConnection({
          host: new URL(address).hostname,
          port: Number(new URL(address).port),
        })
      : net.createConnection({ path: address })
    this.#socket = socket
    this.#buffer = ''

    socket.setEncoding('utf8')
    socket.on('connect', () => this.#onConnect())
    socket.on('data', (chunk: string) => this.#onData(chunk))
    socket.on('error', (error) => {
      this.#logger.debug({ err: error }, 'helper connection error')
    })
    socket.on('close', () => this.#onClose(address))
  }

  async #onConnect() {
    this.#connected = true
    this.#logger.info('connected to the helper')
    try {
      await this.restore(await this.#state())
    } catch (error) {
      this.#logger.error({ err: error }, 'could not sync the helper')
    }
  }

  #onData(chunk: string) {
    this.#buffer += chunk
    let newline = this.#buffer.indexOf('\n')
    while (newline !== -1) {
      const line = this.#buffer.slice(0, newline)
      this.#buffer = this.#buffer.slice(newline + 1)
      this.#onLine(line)
      newline = this.#buffer.indexOf('\n')
    }
  }

  #onLine(line: string) {
    let message: HelperReply | HelperEvent
    try {
      message = JSON.parse(line)
    } catch {
      this.#logger.error({ line }, 'the helper sent a line that is not JSON')
      return
    }

    if ('event' in message) {
      this.deliver(message).catch((error) => {
        this.#logger.error({ err: error, event: message }, 'could not handle a helper event')
      })
      return
    }

    this.#settle(message)
  }

  #settle(reply: HelperReply) {
    const pending = typeof reply.id === 'number' ? this.#pending.get(reply.id) : undefined
    if (!pending) {
      this.#logger.warn({ reply }, 'the helper sent a reply to no pending request')
      return
    }

    this.#pending.delete(reply.id as number)
    clearTimeout(pending.timer)
    if (reply.ok) {
      pending.resolve(reply.result)
      return
    }
    pending.reject(
      new HelperException(reply.error?.code ?? 'unknown', reply.error?.message ?? 'Unknown error')
    )
  }

  #onClose(address: string) {
    if (this.#connected) {
      this.#logger.warn('lost the connection to the helper')
    }
    this.#connected = false
    this.#socket = undefined

    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(new HelperException('unavailable', 'The connection to the helper closed'))
    }
    this.#pending.clear()

    if (this.#stopped) {
      return
    }
    this.#reconnectTimer = setTimeout(() => this.#connect(address), HelperClient.reconnectDelayMs)
  }

  #wireDevice(device: AllowedDevice) {
    return { mac: device.mac, ip: device.ip, speed_cap: this.#wireSpeedCap(device.speedCap) }
  }

  #wireSpeedCap(speedCap: SpeedCap) {
    return { down_kbps: speedCap.downKbps, up_kbps: speedCap.upKbps }
  }
}
