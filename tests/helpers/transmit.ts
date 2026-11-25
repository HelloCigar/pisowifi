import type { Page } from 'playwright'

/**
 * Asks Transmit, from the open page, to subscribe a new event stream to
 * `channel`, the way a hand-made request to `__transmit/subscribe` would, and
 * returns the HTTP status: 204 when allowed, 400 when refused. The page's own
 * client only subscribes to the channels the page names, so a refused
 * subscription can only come from such a request.
 */
// flow-allow transmit-client.md: the test must send the hand-made subscription a malicious
// page would; the app's own client only subscribes to channels the page names.
export async function subscribeFromPage(page: Page, channel: string) {
  return page.evaluate(async (channelName) => {
    // Runs in the browser, whose DOM types the server's tsconfig lacks.
    const browser = globalThis as any
    const uid = crypto.randomUUID()
    const stream = new browser.EventSource(`/__transmit/events?uid=${uid}`)
    try {
      await new Promise((resolve, reject) => {
        stream.addEventListener('open', resolve, { once: true })
        stream.addEventListener('error', reject, { once: true })
      })
      const cookie: string = browser.document.cookie
      const xsrf = cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
      const response = await fetch('/__transmit/subscribe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-xsrf-token': decodeURIComponent(xsrf),
        },
        body: JSON.stringify({ uid, channel: channelName }),
      })
      return response.status
    } finally {
      stream.close()
    }
  }, channel)
}
