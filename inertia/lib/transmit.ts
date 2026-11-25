import { Transmit } from '@adonisjs/transmit-client'

let client: Transmit | undefined

/**
 * The one Transmit client of the browser. It is made on first use, since
 * making it opens the event stream, and pages are also rendered on the
 * server.
 */
export function getTransmit() {
  if (typeof window === 'undefined') {
    throw new Error('Transmit is available only in the browser')
  }

  client ??= new Transmit({
    baseUrl: window.location.origin,
    onSubscribeFailed(response) {
      console.error(`Transmit subscription failed with status ${response.status}`)
    },
  })

  return client
}
