<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import type { TableColumn } from '@nuxt/ui'
import type { Data } from '@generated/data'
import { urlFor } from '~/client'
import AdminLayout from '~/layouts/admin.vue'
import DeleteRateTierModal from '~/components/admin/delete_rate_tier_modal.vue'

defineOptions({ layout: AdminLayout })

defineProps<{
  rateTiers: Data.RateTier[]
}>()

const columns: TableColumn<Data.RateTier>[] = [
  { id: 'price', header: 'Price' },
  { id: 'minutes', header: 'Time' },
  { id: 'actions' },
]
</script>

<template>
  <Head title="Rate Tiers" />

  <UDashboardPanel id="rate-tiers">
    <template #header>
      <UDashboardNavbar title="Rate Tiers">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Add a Rate Tier"
            icon="i-lucide-plus"
            :to="urlFor('admin.rate_tiers.create')"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="text-sm text-muted">
        What each price buys. Customers' coins are priced against these tiers.
      </p>

      <UTable
        class="shrink-0"
        :data="rateTiers"
        :columns="columns"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0',
        }"
      >
        <template #price-cell="{ row }">
          <span class="font-medium text-highlighted">{{ row.original.price.formatted }}</span>
        </template>

        <template #minutes-cell="{ row }">{{ row.original.minutes.formatted }}</template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              :aria-label="`Edit the ${row.original.price.formatted} Rate Tier`"
              :to="urlFor('admin.rate_tiers.edit', { id: row.original.id })"
            />
            <DeleteRateTierModal :rate-tier="row.original" />
          </div>
        </template>

        <template #empty>
          <div class="flex flex-col items-center gap-2 py-6 text-center">
            <UIcon name="i-lucide-coins" class="size-8 text-dimmed" />
            <p class="font-medium text-highlighted">No Rate Tiers yet</p>
            <p class="text-sm text-muted">Add one so Customers can buy time.</p>
          </div>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
