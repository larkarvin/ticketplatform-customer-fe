<script setup lang="ts">
// Form route stub. Proves path routing + shell + per-page title/OG. Real data fetch lands in the
// Forms cycle.
const route = useRoute()
const slug = computed(() => String(route.params.slug))
useHead(() => ({
  title: `Form: ${slug.value}`,
  meta: [{ property: 'og:title', content: `Form: ${slug.value}` }],
}))
</script>

<template>
  <section>
    <h1 class="mb-2 text-2xl font-semibold">Form</h1>
    <p class="text-gray-500">Form "{{ slug }}" — coming soon.</p>
  </section>
</template>
