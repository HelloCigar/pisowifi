<script setup lang="ts">
import { ref } from 'vue'
import { Head } from '@inertiajs/vue3'
import { Form } from '@adonisjs/inertia/vue'
import { urlFor } from '~/client'
import AuthLayout from '~/layouts/auth.vue'
import { useTransmit } from '~/composables/use_transmit'

defineOptions({ layout: AuthLayout })

const props = defineProps<{
  testing: boolean
  channel: string
}>()

interface TestCoin {
  value: { raw: number; formatted: string }
}

/**
 * The coins counted while this page is open, newest first. They exist only
 * to show the Operator the count; the Machine does not keep them.
 */
const coins = ref<TestCoin['value'][]>([])
const { subscribed } = useTransmit<TestCoin>(
  () => props.channel,
  (coin) => coins.value.unshift(coin.value)
)
</script>

<template>
  <Head title="Test your Coin Acceptor" />

  <div class="w-full space-y-6">
    <div class="flex flex-col text-center">
      <div class="mb-2">
        <UIcon name="i-lucide-coins" class="size-8 shrink-0 inline-block text-primary" />
      </div>
      <h1 class="text-xl text-pretty font-semibold text-highlighted">Test your Coin Acceptor</h1>
      <p class="mt-1 text-base text-pretty text-muted">
        Insert a few coins and check that each shows its value. A ₱5 coin should show ₱5. A wrong
        value means the Coin Acceptor is not set to one pulse per peso.
      </p>
    </div>

    <Form v-if="!testing" v-slot="{ processing }" route="coin_test.store">
      <UButton
        type="submit"
        label="Start the test"
        icon="i-lucide-play"
        block
        :loading="processing"
      />
    </Form>

    <template v-else>
      <UAlert
        v-if="subscribed"
        color="info"
        variant="subtle"
        icon="i-lucide-hand-coins"
        title="Insert a coin now"
      />

      <ul v-if="coins.length" class="space-y-2" aria-label="Coins counted">
        <li
          v-for="(coin, index) in coins"
          :key="coins.length - index"
          class="flex items-center justify-between rounded-md bg-elevated px-3 py-2"
        >
          <span class="text-sm text-muted">Coin {{ coins.length - index }}</span>
          <span class="font-semibold text-highlighted">{{ coin.formatted }}</span>
        </li>
      </ul>
      <p v-else class="text-center text-sm text-muted">No coins counted yet.</p>

      <Form v-slot="{ processing }" route="coin_test.destroy">
        <UButton
          type="submit"
          label="Stop the test"
          icon="i-lucide-square"
          color="neutral"
          variant="subtle"
          block
          :loading="processing"
        />
      </Form>
    </template>

    <USeparator />

    <div class="flex items-center justify-between gap-4">
      <p class="text-sm text-muted">Next, set your login, hotspot name and prices.</p>
      <UButton :to="urlFor('setup.create')" label="Next" trailing-icon="i-lucide-arrow-right" />
    </div>
  </div>
</template>
