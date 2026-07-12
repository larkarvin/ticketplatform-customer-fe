<script setup lang="ts">
import { Calendar, CheckCircle, Link2 } from '#icons'
defineProps<{ steps: { title: string; body: string }[] }>()
const icons = [Calendar, Link2, CheckCircle]
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-16">
    <div class="grid gap-8 sm:grid-cols-3">
      <div v-for="(s, i) in steps" :key="s.title" class="text-center">
        <component :is="icons[i]" :size="40" class="mx-auto text-brand-500" aria-hidden="true" />
        <h3 class="mt-4 text-lg font-semibold text-gray-900">{{ s.title }}</h3>
        <p class="mt-2 text-gray-600">{{ s.body }}</p>
      </div>
    </div>
  </section>
</template>
