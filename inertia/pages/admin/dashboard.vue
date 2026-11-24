<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import AdminLayout from '~/layouts/admin.vue'

defineOptions({ layout: AdminLayout })
</script>

<template>
  <Head title="Dashboard" />

  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageCard
        variant="subtle"
        icon="i-lucide-wifi"
        title="Your Machine is set up"
        description="Customers can now see your Rate Tiers on the portal."
      />
    </template>
  </UDashboardPanel>
</template>
