import env from '#start/env'

/**
 * The captive portal.
 */
const portalConfig = {
  /**
   * The address Customers reach the portal at, such as `http://10.0.0.1`
   * on the Machine. A request for any other host is sent here.
   */
  url: env.get('APP_URL'),
}

export default portalConfig
