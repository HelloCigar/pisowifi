<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import type { AuthFormField } from '@nuxt/ui'
import AuthLayout from '~/layouts/auth.vue'
import AuthForm from '~/components/auth_form.vue'

defineOptions({ layout: AuthLayout })

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'you@example.com',
    autocomplete: 'username',
    required: true,
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    autocomplete: 'current-password',
    required: true,
  },
]
</script>

<template>
  <Head title="Sign in" />

  <AuthForm
    route="admin.session.store"
    :fields="fields"
    icon="i-lucide-lock"
    title="Welcome back"
    :submit="{ label: 'Sign in' }"
    :reset-on-error="['password']"
  />
</template>
