<script setup lang="ts">
// Event route stub. Proves path routing + shell + per-page title/OG. Real data fetch lands in the
// Events cycle.
const route = useRoute()
const slug = computed(() => String(route.params.slug))
useHead(() => ({
  title: `Event: ${slug.value}`,
  meta: [{ property: 'og:title', content: `Event: ${slug.value}` }],
}))
</script>

<template>
  <section>
    <h1 class="mb-2 text-2xl font-semibold">Event</h1>
    <p class="text-gray-500">Event "{{ slug }}" — details coming soon.</p>
  </section>
</template>
