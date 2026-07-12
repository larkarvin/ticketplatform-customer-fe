<!-- app/whitelabels/catholic/components/UseCases.vue — a warm grid of the ways a parish gathers.
     No imagery: each card is a gold rule + title + one line. -->
<script setup lang="ts">
defineProps<{
  eyebrow: string
  heading: string
  subheading: string
  items: { title: string; body: string }[]
}>()
</script>

<template>
  <section class="ct-stone">
    <div class="mx-auto max-w-6xl px-6 py-24">
      <div class="mx-auto max-w-2xl text-center">
        <p class="ct-eyebrow ct-eyebrow--center">{{ eyebrow }}</p>
        <h2 class="mt-3 text-4xl text-brand-600">{{ heading }}</h2>
        <p class="mt-3 text-lg text-gray-600">{{ subheading }}</p>
      </div>
      <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="useCase in items" :key="useCase.title" class="rounded-2xl border border-gray-200 bg-white p-6">
          <div class="ct-gold-rule mb-4 h-px w-8"></div>
          <h3 class="text-lg text-brand-600">{{ useCase.title }}</h3>
          <p class="mt-1 text-sm text-gray-600">{{ useCase.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
