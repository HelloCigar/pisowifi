<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { useRouter } from '@adonisjs/inertia/vue'
import AuthLayout from '~/layouts/auth.vue'

defineOptions({ layout: AuthLayout })

/**
 * Placeholder landing page after login. The Operator's admin panel
 * replaces it.
 */
const router = useRouter()

function logout() {
  router.post({ route: 'session.destroy' })
}
</script>

<template>
  <Head title="Dashboard" />

  <div class="flex flex-col items-center gap-4 text-center">
    <UIcon name="i-lucide-wifi" class="size-8 text-primary" />
    <p class="text-highlighted font-medium">You are signed in.</p>
    <UButton color="neutral" variant="subtle" block @click="logout">Sign out</UButton>
  </div>
</template>
