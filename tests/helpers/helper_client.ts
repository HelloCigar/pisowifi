import { useFake } from '@japa/plugin-adonisjs/helpers'
import HelperClient from '#services/helper_client'
import FakeHelperClient from '#services/fake_helper_client'

/**
 * Swaps the helper client for an in-memory fake for the current test. The
 * helper client wraps the privileged helper process (`helper/`, ADR 0002),
 * which runs as root outside the app and owns the firewall, the speed caps, the
 * DHCP leases and the Coin Acceptor.
 *
 * The fake starts as the helper does: every Device blocked and the Coin
 * Acceptor inhibited, until the first `sync`.
 */
export function useFakeHelperClient() {
  const fake = new FakeHelperClient()
  useFake(HelperClient, fake)
  return fake
}

/**
 * Swaps in the fake helper as the running app finds it: connected, and past the
 * first `sync`, which allowed no Device. The app can then let Devices online
 * and turn the Coin Acceptor's inhibit line off.
 */
export async function useSyncedFakeHelperClient() {
  const fake = useFakeHelperClient()
  await fake.sync([])
  return fake
}
