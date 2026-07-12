<!-- app/whitelabels/sportsquad/components/HowItWorks.vue — ported from demo-1's "features-6" icon-block
     trio (id="features-6"): a flaticon glyph + heading + text repeated 3x. Glyphs swapped for #icons;
     jQuery `wow` reveal classes dropped. -->
<script setup lang="ts">
import { Calendar, CheckCircle, Link2 } from '#icons'
defineProps<{ steps: { title: string; body: string }[] }>()
const icons = [Calendar, Link2, CheckCircle]
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-20">
    <h2 class="text-center text-2xl font-bold text-gray-900 sm:text-3xl">How it works</h2>
    <div class="mt-12 grid gap-10 sm:grid-cols-3">
      <div v-for="(s, i) in steps" :key="s.title" class="text-center">
        <div class="sq-accent-bg mx-auto flex size-14 items-center justify-center rounded-full">
          <component :is="icons[i]" :size="26" class="text-white" aria-hidden="true" />
        </div>
        <h3 class="mt-4 text-lg font-semibold text-gray-900">{{ s.title }}</h3>
        <p class="mt-2 text-gray-600">{{ s.body }}</p>
      </div>
    </div>
  </section>
</template>
