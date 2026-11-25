<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { Form } from '@adonisjs/inertia/vue'
import { usePortalText } from '~/composables/use_portal_text'

/**
 * The Customer-facing shell of the portal: one narrow column that fits a phone,
 * a header with the Machine's name and the language switch, and the page
 * below.
 */
const page = usePage()
const text = usePortalText()
const otherLanguage = computed(() => (page.props.portalLanguage === 'fil' ? 'en' : 'fil'))
</script>

<template>
  <div class="min-h-svh flex flex-col bg-elevated/25">
    <header class="border-b border-default bg-default">
      <div class="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-4 py-3">
        <div class="flex items-center gap-2 font-semibold text-highlighted">
          <UIcon name="i-lucide-wifi" class="size-5 text-primary" />
          <span>{{ page.props.hotspotName ?? 'Piso WiFi' }}</span>
        </div>

        <Form
          v-slot="{ processing }"
          route="portal_language.update"
          :options="{ preserveScroll: true }"
        >
          <input type="hidden" name="language" :value="otherLanguage" />
          <UButton
            type="submit"
            :lang="otherLanguage"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-languages"
            :label="text.switchLanguage"
            :loading="processing"
          />
        </Form>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <slot />
    </main>
  </div>
</template>
