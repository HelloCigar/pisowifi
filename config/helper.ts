import env from '#start/env'

/**
 * Where the app reaches the privileged helper (ADR 0002, helper/PROTOCOL.md).
 */
const helperConfig = {
  /**
   * The path of the helper's Unix socket, such as
   * `/run/pisowifi/helper.sock` on the Machine. On a Windows PC, where Node
   * cannot reach a Unix socket, run the simulator with `-tcp` and use
   * `tcp://127.0.0.1:<port>`. When it is not set, the app does not connect.
   */
  address: env.get('HELPER_ADDRESS'),
}

export default helperConfig
