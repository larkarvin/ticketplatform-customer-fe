<!-- customer-fe/app/features/events/components/EventDetailsBody.vue -->
<!-- Renders the event's rich `details` body. The HTML is sanitized server-side (api Purifier), so it
     is trusted here; v-html is safe. -->
<script setup lang="ts">
defineProps<{ html: string | null }>()
</script>

<template>
  <section v-if="html" class="space-y-3">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">About this event</h2>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="prose prose-sm max-w-none text-gray-700 dark:prose-invert" v-html="html" />
  </section>
</template>
