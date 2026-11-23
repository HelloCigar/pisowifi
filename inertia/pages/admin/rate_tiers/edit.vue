<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { Form } from '@adonisjs/inertia/vue'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import AdminLayout from '~/layouts/admin.vue'

defineOptions({ layout: AdminLayout })

/**
 * Validation rules live in `updateRateTierValidator`
 * (app/validators/rate_tier.ts)
 */
defineProps<{
  rateTier: Data.RateTier
}>()
</script>

<template>
  <Head title="Edit a Rate Tier" />

  <UDashboardPanel id="rate-tiers-edit">
    <template #header>
      <UDashboardNavbar :title="`Edit the ${rateTier.price.formatted} Rate Tier`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <Form
        v-slot="{ errors, processing }"
        route="admin.rate_tiers.update"
        :params="{ id: rateTier.id }"
        :options="{ preserveScroll: true }"
        class="max-w-sm space-y-4"
      >
        <UFormField label="Price (₱)" name="price" required :error="errors.price">
          <UInput
            id="price"
            name="price"
            type="number"
            inputmode="numeric"
            min="1"
            step="1"
            :default-value="rateTier.price.raw"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Minutes" name="minutes" required :error="errors.minutes">
          <UInput
            id="minutes"
            name="minutes"
            type="number"
            inputmode="numeric"
            min="1"
            step="1"
            :default-value="rateTier.minutes.raw"
            class="w-full"
          />
        </UFormField>

        <div class="flex gap-2">
          <UButton type="submit" label="Save" :loading="processing" />
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :to="urlFor('admin.rate_tiers.index')"
          />
        </div>
      </Form>
    </template>
  </UDashboardPanel>
</template>
