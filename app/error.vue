<script setup lang="ts">
import type { NuxtError } from '#app'

// Covers 404 (incl. unknown org) and 500. Standalone full-screen (Nuxt renders this in place of the
// app), so it doesn't use the default layout.
const props = defineProps<{ error: NuxtError }>()
const isNotFound = computed(() => props.error.statusCode === 404)
const heading = computed(() => (isNotFound.value ? 'Page not found' : 'Something went wrong'))
const message = computed(() =>
  isNotFound.value ? "We couldn't find what you're looking for." : 'Please try again in a moment.'
)
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-4 text-center">
    <h1 class="mb-2 text-2xl font-semibold">{{ heading }}</h1>
    <p class="mb-6 text-gray-500">{{ message }}</p>
    <button
      type="button"
      class="min-h-tap rounded-lg px-5 text-white"
      :style="{ backgroundColor: 'var(--color-brand-500)' }"
      @click="clearError({ redirect: '/' })"
    >
      Go home
    </button>
  </div>
</template>
