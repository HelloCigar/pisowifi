import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

/**
 * The portal's words in each language. Filipino is the default; the
 * Customer can switch to English for the visit.
 */
const portalText = {
  fil: {
    switchLanguage: 'English',
    noCreditTitle: 'Wala ka pang Credit',
    noCreditBody: 'Maghulog ng barya sa Machine para makapag-internet.',
    yourDevice: 'Iyong Device',
    unknownDeviceTitle: 'Hindi makilala ang iyong Device',
    unknownDeviceBody: 'Kumonekta sa Wi-Fi ng Machine na ito, saka buksan muli ang pahinang ito.',
    notReadyTitle: 'Hindi pa handa ang Machine',
    notReadyBody: 'Hindi pa ito naise-set up ng Operator. Subukan muli mamaya.',
  },
  en: {
    switchLanguage: 'Filipino',
    noCreditTitle: 'You have no Credit yet',
    noCreditBody: 'Insert coins into the Machine to get online.',
    yourDevice: 'Your Device',
    unknownDeviceTitle: 'We cannot recognize your Device',
    unknownDeviceBody: "Connect to this Machine's Wi-Fi, then open this page again.",
    notReadyTitle: "This Machine isn't ready yet",
    notReadyBody: 'Its Operator has not set it up yet. Please try again later.',
  },
} as const

/**
 * The portal's words in the language the Customer picked.
 */
export function usePortalText() {
  const page = usePage()
  return computed(() => portalText[page.props.portalLanguage])
}
