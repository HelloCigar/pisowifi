<script setup lang="ts">
import { ref } from 'vue'
import { Form } from '@adonisjs/inertia/vue'
import type { Data } from '@generated/data'

/** Asks the Operator to confirm before a Rate Tier is deleted. */
defineProps<{
  rateTier: Data.RateTier
}>()

const open = ref(false)
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Delete the ${rateTier.price.formatted} Rate Tier`"
    :description="`Customers will no longer get ${rateTier.minutes.formatted} for ${rateTier.price.formatted}.`"
  >
    <UButton
      icon="i-lucide-trash"
      color="error"
      variant="ghost"
      :aria-label="`Delete the ${rateTier.price.formatted} Rate Tier`"
    />

    <template #body>
      <Form
        v-slot="{ processing }"
        route="admin.rate_tiers.destroy"
        :params="{ id: rateTier.id }"
        :options="{ preserveScroll: true }"
        class="flex justify-end gap-2"
        @success="open = false"
      >
        <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
        <UButton type="submit" label="Delete" color="error" :loading="processing" />
      </Form>
    </template>
  </UModal>
</template>
