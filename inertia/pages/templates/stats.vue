<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { sub } from 'date-fns'
import { Head } from '@inertiajs/vue3'
import type { DropdownMenuItem } from '@nuxt/ui'
import { urlFor } from '~/client'
import { useDashboard } from '~/composables/use_dashboard'
import type { Period, Range } from '~/types/dashboard'
import DashboardLayout from '~/layouts/dashboard.vue'
import StatsCards from '~/components/templates/stats/stats_cards.vue'
import StatsSales from '~/components/templates/stats/stats_sales.vue'
import StatsPeriodSelect from '~/components/templates/stats/stats_period_select.vue'
import StatsDateRangePicker from '~/components/templates/stats/stats_date_range_picker.vue'
import StatsChart from '~/components/templates/stats/stats_chart.vue'

defineOptions({ layout: DashboardLayout })

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [
  [
    {
      label: 'New mail',
      icon: 'i-lucide-send',
      to: urlFor('templates.list_detail.index'),
    },
    {
      label: 'New customer',
      icon: 'i-lucide-user-plus',
      to: urlFor('templates.table.index'),
    },
  ],
] satisfies DropdownMenuItem[][]

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date(),
})
const period = ref<Period>('daily')
</script>

<template>
  <Head title="Home" />

  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <StatsDateRangePicker v-model="range" class="-ms-1" />

          <StatsPeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <StatsCards :period="period" :range="range" />
      <StatsChart :period="period" :range="range" />
      <StatsSales :period="period" :range="range" />
    </template>
  </UDashboardPanel>
</template>
