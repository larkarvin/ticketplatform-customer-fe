<!-- app/whitelabels/catholic/components/HowItWorks.vue — three gentle steps. Roman numerals are the
     structural device because the steps are a real sequence; a gold rule sits under each. -->
<script setup lang="ts">
defineProps<{
  eyebrow: string
  heading: string
  items: { numeral: string; title: string; body: string }[]
}>()
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-24">
    <div class="mx-auto max-w-2xl text-center">
      <p class="ct-eyebrow ct-eyebrow--center">{{ eyebrow }}</p>
      <h2 class="mt-3 text-4xl text-brand-600">{{ heading }}</h2>
    </div>
    <div class="mx-auto mt-14 grid max-w-4xl gap-12 sm:grid-cols-3">
      <div v-for="step in items" :key="step.numeral" class="text-center">
        <div class="ct-display ct-gold-text text-3xl font-semibold">{{ step.numeral }}</div>
        <div class="ct-gold-rule mx-auto mt-4 mb-5 h-px w-9"></div>
        <h3 class="text-xl text-brand-600">{{ step.title }}</h3>
        <p class="mt-2 text-sm text-gray-600">{{ step.body }}</p>
      </div>
    </div>
  </section>
</template>
