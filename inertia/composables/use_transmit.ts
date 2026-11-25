import { onMounted, onUnmounted, ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { getTransmit } from '~/lib/transmit'

/**
 * Listens to a Transmit channel while the component is mounted. `subscribed`
 * turns true once the server has accepted the subscription, from when no
 * message to the channel is missed.
 */
export function useTransmit<T>(channel: MaybeRefOrGetter<string>, handler: (message: T) => void) {
  const subscribed = ref(false)
  let stopWatching: (() => void) | undefined

  onMounted(() => {
    stopWatching = watch(
      () => toValue(channel),
      (channelName, _, onCleanup) => {
        const subscription = getTransmit().subscription(channelName)
        const removeHandler = subscription.onMessage<T>(handler)
        const created = subscription.create()
        let current = true
        void created.then(() => {
          if (current) {
            subscribed.value = subscription.isCreated
          }
        })

        onCleanup(() => {
          current = false
          subscribed.value = false
          removeHandler()

          void created.then(async () => {
            if (subscription.handlerCount === 0) {
              await subscription.delete()
            }
          })
        })
      },
      { immediate: true }
    )
  })

  onUnmounted(() => stopWatching?.())

  return { subscribed }
}

/**
 * Calls `handler` each time the live connection comes back after it was lost,
 * while the component is mounted. Messages sent while it was down are not
 * replayed, so a page re-reads what it shows here.
 */
export function useTransmitReconnect(handler: () => void) {
  let lost = false
  const onReconnecting = () => {
    lost = true
  }
  const onConnected = () => {
    if (!lost) {
      return
    }
    lost = false
    handler()
  }

  onMounted(() => {
    getTransmit().on('reconnecting', onReconnecting)
    getTransmit().on('connected', onConnected)
  })

  onUnmounted(() => {
    getTransmit().off('reconnecting', onReconnecting)
    getTransmit().off('connected', onConnected)
  })
}
