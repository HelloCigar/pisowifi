import { useFake } from '@japa/plugin-adonisjs/helpers'
import HelperClient from '#services/helper_client'
import FakeHelperClient from '#services/fake_helper_client'

/**
 * Swaps the helper client for an in-memory fake for the current test. The
 * helper client wraps the privileged helper process (`helper/`, ADR 0002),
 * which runs as root outside the app and owns the firewall, the speed caps
 * and the DHCP leases.
 */
export function useFakeHelperClient() {
  const fake = new FakeHelperClient()
  useFake(HelperClient, fake)
  return fake
}
