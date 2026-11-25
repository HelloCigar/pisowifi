import { computed, onMounted, onUnmounted, ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { Duration } from 'luxon'

/**
 * A time span from the server, such as a Coin Window's `closesIn`, as it counts
 * down in the browser: once a second, from when the page received it. Each new
 * value from the server, after a coin or a reload, starts it again.
 *
 * It counts from the browser's own clock, so a Machine whose clock is off does
 * not skew it.
 */
export function useCountdown(span: MaybeRefOrGetter<{ raw: number } | null | undefined>) {
  const page = usePage()
  const now = ref(Date.now())
  let receivedAt = now.value
  let timer: ReturnType<typeof setInterval> | undefined

  watch(
    () => toValue(span),
    () => {
      receivedAt = Date.now()
      now.value = receivedAt
    }
  )
  onMounted(() => {
    timer = setInterval(() => (now.value = Date.now()), 1000)
  })
  onUnmounted(() => clearInterval(timer))

  return computed(() => {
    const value = toValue(span)
    if (!value) {
      return null
    }

    const elapsed = Math.floor((now.value - receivedAt) / 1000)
    const seconds = Math.max(0, value.raw - elapsed)
    // flow-allow flow-response-design: the transformer formats the span once, when the
    // page loads; a countdown changes every second, so the page formats it, the same way
    // TimeSpan#format does on the server.
    const duration =
      seconds === 0
        ? Duration.fromObject({ seconds: 0 })
        : Duration.fromObject({ seconds }).rescale()
    return duration
      .reconfigure({ locale: page.props.portalLanguage })
      .toHuman({ unitDisplay: 'long' })
  })
}
