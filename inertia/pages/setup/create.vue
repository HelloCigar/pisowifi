<script setup lang="ts">
import { ref } from 'vue'
import { Head } from '@inertiajs/vue3'
import { Form, Link } from '@adonisjs/inertia/vue'
import AuthLayout from '~/layouts/auth.vue'

defineOptions({ layout: AuthLayout })

/**
 * The setup wizard of a newly installed Machine. Validation rules live in
 * `setupValidator` (app/validators/setup.ts).
 */

/**
 * One key per Rate Tier row, so removing a row keeps the others' inputs.
 */
let nextKey = 1
const tierKeys = ref<number[]>([nextKey])

function addTier() {
  nextKey += 1
  tierKeys.value.push(nextKey)
}

function removeTier(index: number) {
  tierKeys.value.splice(index, 1)
}

/**
 * Read the server-side validation error of a field
 */
function errorOf(errors: object, name: string) {
  return (errors as Record<string, string | undefined>)[name]
}
</script>

<template>
  <Head title="Set up your Machine" />

  <div class="w-full space-y-6">
    <div class="flex flex-col text-center">
      <div class="mb-2">
        <UIcon name="i-lucide-wifi" class="size-8 shrink-0 inline-block text-primary" />
      </div>
      <h1 class="text-xl text-pretty font-semibold text-highlighted">Set up your Machine</h1>
      <p class="mt-1 text-base text-pretty text-muted">
        Create your login, name your hotspot and set your prices. You can change them later.
      </p>
      <Link route="coin_test.create" class="mt-2 text-sm font-medium text-primary">
        Back to the Coin Acceptor test
      </Link>
    </div>

    <Form
      v-slot="{ errors, processing }"
      route="setup.store"
      :options="{ preserveScroll: true }"
      :reset-on-error="['password', 'passwordConfirmation']"
      class="space-y-6"
    >
      <fieldset class="space-y-4">
        <legend class="mb-4 text-sm font-semibold text-highlighted">Your login</legend>

        <UFormField label="Email" name="email" required :error="errorOf(errors, 'email')">
          <UInput
            id="email"
            name="email"
            type="email"
            autocomplete="username"
            placeholder="you@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password" required :error="errorOf(errors, 'password')">
          <UInput
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            placeholder="At least 8 characters"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Confirm password"
          name="passwordConfirmation"
          required
          :error="errorOf(errors, 'passwordConfirmation')"
        >
          <UInput
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            placeholder="Repeat your password"
            class="w-full"
          />
        </UFormField>
      </fieldset>

      <USeparator />

      <fieldset class="space-y-4">
        <legend class="mb-4 text-sm font-semibold text-highlighted">Your hotspot</legend>

        <UFormField
          label="Hotspot name"
          name="hotspotName"
          required
          help="The name Customers see on the portal."
          :error="errorOf(errors, 'hotspotName')"
        >
          <UInput id="hotspotName" name="hotspotName" placeholder="Piso WiFi" class="w-full" />
        </UFormField>
      </fieldset>

      <USeparator />

      <fieldset class="space-y-4">
        <legend class="mb-1 text-sm font-semibold text-highlighted">Rate Tiers</legend>
        <p class="text-sm text-muted">What each price buys, such as ₱5 for 60 minutes.</p>

        <div v-for="(key, index) in tierKeys" :key="key" class="flex items-start gap-2">
          <UFormField
            label="Price (₱)"
            :name="`rateTiers.${index}.price`"
            class="flex-1"
            :error="errorOf(errors, `rateTiers.${index}.price`)"
          >
            <UInput
              :name="`rateTiers[${index}][price]`"
              :aria-label="`Price of tier ${index + 1}`"
              type="number"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="5"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Minutes"
            :name="`rateTiers.${index}.minutes`"
            class="flex-1"
            :error="errorOf(errors, `rateTiers.${index}.minutes`)"
          >
            <UInput
              :name="`rateTiers[${index}][minutes]`"
              :aria-label="`Minutes of tier ${index + 1}`"
              type="number"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="60"
              class="w-full"
            />
          </UFormField>

          <UButton
            v-if="tierKeys.length > 1"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            class="mt-6"
            :aria-label="`Remove tier ${index + 1}`"
            @click="removeTier(index)"
          />
        </div>

        <p v-if="errorOf(errors, 'rateTiers')" class="text-sm text-error">
          {{ errorOf(errors, 'rateTiers') }}
        </p>

        <UButton
          label="Add a Rate Tier"
          icon="i-lucide-plus"
          color="neutral"
          variant="subtle"
          @click="addTier"
        />
      </fieldset>

      <UButton type="submit" label="Finish setup" block :loading="processing" />
    </Form>
  </div>
</template>
