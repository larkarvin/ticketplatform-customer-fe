<script setup lang="ts">
defineProps<{ title: string; body: string }>()
</script>

<template>
  <section class="bg-brand-25">
    <div class="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 class="text-2xl font-semibold text-gray-900 sm:text-3xl">{{ title }}</h2>
      <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{{ body }}</p>
    </div>
  </section>
</template>
