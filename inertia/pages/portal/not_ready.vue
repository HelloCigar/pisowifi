<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import PortalLayout from '~/layouts/portal.vue'
import { usePortalText } from '~/composables/use_portal_text'

defineOptions({ layout: PortalLayout })

const text = usePortalText()
</script>

<template>
  <Head title="Piso WiFi" />

  <UPageCard variant="subtle" icon="i-lucide-construction">
    <template #title>
      <h1 class="text-lg font-semibold text-highlighted">
        {{ text.notReadyTitle }}
      </h1>
    </template>
    <template #description>
      {{ text.notReadyBody }}
    </template>
  </UPageCard>
</template>
