<script setup lang="ts">
import { watchEffect } from 'vue'
import { Head, usePoll } from '@inertiajs/vue3'
import { Form } from '@adonisjs/inertia/vue'
import type { Data } from '@generated/data'
import PortalLayout from '~/layouts/portal.vue'
import { usePortalText } from '~/composables/use_portal_text'

defineOptions({ layout: PortalLayout })

const props = defineProps<{
  device: Data.Device
  credit: Data.Credit | null
  coinWindow: Data.CoinWindow.Variants['forHolder'] | null
  coinAcceptorBusy: Data.CoinWindow | null
}>()

const text = usePortalText()

// While a Coin Window is open the page reloads its props, so new coins, the
// close time, the Credit after a timeout and a freed Coin Acceptor show
// without a reload. #9 replaces this with updates pushed over Transmit.
const poll = usePoll(2000, {}, { autoStart: false })
watchEffect(() => (props.coinWindow || props.coinAcceptorBusy ? poll.start() : poll.stop()))
</script>

<template>
  <Head title="Piso WiFi" />

  <UPageCard v-if="credit" variant="subtle" icon="i-lucide-wifi">
    <template #title>
      <h1 class="text-lg font-semibold text-highlighted">{{ text.onlineTitle }}</h1>
    </template>
    <template #description>
      <dl class="grid gap-3">
        <div>
          <dt class="text-sm text-muted">{{ text.timeLeft }}</dt>
          <dd class="text-2xl font-semibold text-highlighted">{{ credit.timeLeft.formatted }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{{ text.resumeCode }}</dt>
          <dd class="font-mono text-xl tracking-widest text-highlighted">
            {{ credit.resumeCode }}
          </dd>
          <p class="text-xs text-muted">{{ text.resumeCodeHint }}</p>
        </div>
        <div v-if="credit.lastTopUp">
          <dt class="text-sm text-muted">{{ text.lastTopUp }}</dt>
          <dd class="text-highlighted">
            {{ credit.lastTopUp.added.formatted }} ({{ credit.lastTopUp.total.formatted }})
          </dd>
        </div>
      </dl>
    </template>
  </UPageCard>

  <UPageCard v-else-if="!coinWindow" variant="subtle" icon="i-lucide-coins">
    <template #title>
      <h1 class="text-lg font-semibold text-highlighted">{{ text.noCreditTitle }}</h1>
    </template>
    <template #description>
      {{ text.noCreditBody }}
    </template>
  </UPageCard>

  <UPageCard v-if="coinWindow" variant="outline" icon="i-lucide-hand-coins">
    <template #title>
      <h2 class="text-lg font-semibold text-highlighted">{{ text.insertCoinsTitle }}</h2>
    </template>
    <template #description>
      <dl class="grid gap-3">
        <div>
          <dt class="text-sm text-muted">{{ text.inserted }}</dt>
          <dd class="text-2xl font-semibold text-highlighted">
            {{ coinWindow.inserted.formatted }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{{ text.windowClosesIn }}</dt>
          <dd class="text-highlighted">{{ coinWindow.closesIn.formatted }}</dd>
        </div>
      </dl>
    </template>
    <Form v-slot="{ processing }" route="coin_window.destroy">
      <UButton
        type="submit"
        block
        size="xl"
        icon="i-lucide-check"
        :label="text.done"
        :loading="processing"
      />
    </Form>
  </UPageCard>

  <UAlert
    v-else-if="coinAcceptorBusy"
    color="warning"
    variant="subtle"
    icon="i-lucide-hourglass"
    :title="text.busyTitle"
    :description="`${text.busyFreeIn} ${coinAcceptorBusy.closesIn.formatted}`"
  />

  <Form v-else v-slot="{ processing }" route="coin_window.store">
    <UButton
      type="submit"
      block
      size="xl"
      icon="i-lucide-coins"
      :label="text.insertCoin"
      :loading="processing"
    />
  </Form>

  <p class="text-center text-sm text-muted">
    {{ text.yourDevice }}: <span class="font-mono">{{ device.macAddress }}</span>
  </p>
</template>
