import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

/**
 * The portal's words in each language. Filipino is the default; the Customer
 * can switch to English for the visit.
 */
const portalText = {
  fil: {
    switchLanguage: 'English',
    noCreditTitle: 'Wala ka pang Credit',
    noCreditBody:
      'Pindutin ang Maghulog ng Barya, saka maghulog ng barya sa Machine para makapag-internet.',
    yourDevice: 'Iyong Device',
    insertCoin: 'Maghulog ng Barya',
    insertCoinsTitle: 'Maghulog na ng barya',
    inserted: 'Naihulog',
    windowClosesIn: 'Magsasara ang Coin Acceptor sa loob ng',
    done: 'Tapos na',
    busyTitle: 'May gumagamit ng Coin Acceptor',
    busyFreeIn: 'Magagamit mo ito sa loob ng',
    onlineTitle: 'Online ka na',
    timeLeft: 'Natitirang oras',
    resumeCode: 'Resume Code',
    resumeCodeHint: 'Isulat ito. Ito ang magbabalik ng iyong oras sa ibang Device.',
    lastTopUp: 'Naidagdag ng huling hulog',
    unknownDeviceTitle: 'Hindi makilala ang iyong Device',
    unknownDeviceBody: 'Kumonekta sa Wi-Fi ng Machine na ito, saka buksan muli ang pahinang ito.',
    notReadyTitle: 'Hindi pa handa ang Machine',
    notReadyBody: 'Hindi pa ito naise-set up ng Operator. Subukan muli mamaya.',
  },
  en: {
    switchLanguage: 'Filipino',
    noCreditTitle: 'You have no Credit yet',
    noCreditBody: 'Tap Insert Coin, then drop coins into the Machine to get online.',
    yourDevice: 'Your Device',
    insertCoin: 'Insert Coin',
    insertCoinsTitle: 'Insert your coins now',
    inserted: 'Inserted',
    windowClosesIn: 'The Coin Acceptor closes in',
    done: 'Done',
    busyTitle: 'Coin Acceptor busy',
    busyFreeIn: 'It will be free in',
    onlineTitle: "You're online",
    timeLeft: 'Time left',
    resumeCode: 'Resume Code',
    resumeCodeHint: 'Write it down. It gets your time back on another Device.',
    lastTopUp: 'Your last top-up added',
    unknownDeviceTitle: 'We cannot recognize your Device',
    unknownDeviceBody: "Connect to this Machine's Wi-Fi, then open this page again.",
    notReadyTitle: "This Machine isn't ready yet",
    notReadyBody: 'Its Operator has not set it up yet. Please try again later.',
  },
} as const

/** The portal's words in the language the Customer picked. */
export function usePortalText() {
  const page = usePage()
  return computed(() => portalText[page.props.portalLanguage])
}
