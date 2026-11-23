<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import type { Data } from '@generated/data'
import PortalLayout from '~/layouts/portal.vue'
import { usePortalText } from '~/composables/use_portal_text'

defineOptions({ layout: PortalLayout })

defineProps<{
  device: Data.Device
}>()

const text = usePortalText()
</script>

<template>
  <Head title="Piso WiFi" />

  <UPageCard variant="subtle" icon="i-lucide-coins">
    <template #title>
      <h1 class="text-lg font-semibold text-highlighted">{{ text.noCreditTitle }}</h1>
    </template>
    <template #description>
      {{ text.noCreditBody }}
    </template>
  </UPageCard>

  <p class="text-center text-sm text-muted">
    {{ text.yourDevice }}: <span class="font-mono">{{ device.macAddress }}</span>
  </p>
</template>
