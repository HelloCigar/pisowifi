import type HelperException from '#exceptions/helper_exception'

/**
 * Shapes of the helper protocol (helper/PROTOCOL.md). The helper is the
 * privileged process that owns the firewall, the speed caps and the DHCP
 * leases (ADR 0002).
 */

/**
 * A speed cap in kilobits per second. Both values are positive.
 */
export type SpeedCap = {
  downKbps: number
  upKbps: number
}

/**
 * One Device the firewall lets through.
 */
export type AllowedDevice = {
  mac: string
  ip: string
  speedCap: SpeedCap
}

/**
 * What a `health` request reports.
 */
export type HelperHealth = {
  backend: string
  synced: boolean
}

/**
 * An event the helper pushes as it happens.
 */
export type HelperEvent =
  | { event: 'device_online'; data: { mac: string; ip: string } }
  | { event: 'device_offline'; data: { mac: string } }

/**
 * The helper's answer to one request, matched to it by `id`.
 */
export type HelperReply = {
  id: number | string | null
  ok: boolean
  result?: unknown
  error?: { code: string; message: string }
}

/**
 * A request the app sent and whose reply has not arrived yet.
 */
export type PendingHelperRequest = {
  resolve: (result: unknown) => void
  reject: (error: HelperException) => void
  timer: NodeJS.Timeout
}
