<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import PortalLayout from '~/layouts/portal.vue'
import { usePortalText } from '~/composables/use_portal_text'

defineOptions({ layout: PortalLayout })

const text = usePortalText()
</script>

<template>
  <Head title="Piso WiFi" />

  <UPageCard variant="subtle" icon="i-lucide-circle-help">
    <template #title>
      <h1 class="text-lg font-semibold text-highlighted">{{ text.unknownDeviceTitle }}</h1>
    </template>
    <template #description>
      {{ text.unknownDeviceBody }}
    </template>
  </UPageCard>
</template>
