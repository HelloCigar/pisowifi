<script setup lang="ts">
import { ref } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useRouter } from '@adonisjs/inertia/vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { urlFor } from '~/client'

/**
 * The Operator's admin panel: a sidebar with the admin pages and the logout,
 * and the page beside it. The admin panel is always in English.
 */
const open = ref(false)
const router = useRouter()
const page = usePage()

function close() {
  open.value = false
}

const links = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-house',
    to: urlFor('admin.dashboard'),
    exact: true,
    onSelect: close,
  },
  {
    label: 'Rate Tiers',
    icon: 'i-lucide-coins',
    to: urlFor('admin.rate_tiers.index'),
    onSelect: close,
  },
] satisfies NavigationMenuItem[]

function logout() {
  router.post({ route: 'admin.session.destroy' })
}
</script>

<template>
  <UDashboardGroup unit="rem" storage="local">
    <UDashboardSidebar
      id="admin"
      v-model:open="open"
      collapsible
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-2.5 font-semibold text-highlighted">
          <UIcon name="i-lucide-wifi" class="size-5 shrink-0 text-primary" />
          <span v-if="!collapsed">{{ page.props.hotspotName ?? 'Piso WiFi' }}</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="links" orientation="vertical" tooltip />
      </template>

      <template #footer="{ collapsed }">
        <UButton
          :label="collapsed ? undefined : 'Log out'"
          aria-label="Log out"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          block
          :square="collapsed"
          @click="logout"
        />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
