<script setup lang="ts">
import { useAppLabels } from '#core/composables/useAppLabels'

const { org } = useAppLabels()
useHead({ title: 'Events' })
</script>

<template>
  <section>
    <h1 class="mb-2 text-3xl font-semibold">Discover events</h1>
    <p class="text-gray-500">This {{ org }}'s event discovery is coming soon.</p>
  </section>
</template>
