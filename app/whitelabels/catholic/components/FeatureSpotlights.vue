<!-- app/whitelabels/catholic/components/FeatureSpotlights.vue — alternating deep-dive rows (copy + a
     stylized on-brand visual) for the core features. Visuals are CSS/#icons compositions (no photos). -->
<script setup lang="ts">
import { Check } from '#icons'

defineProps<{
  items: { visual: string; eyebrow: string; title: string; body: string; points: string[] }[]
}>()

// A small fixed "QR" pattern for the check-in visual (illustrative, not a real code).
const qr = [1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1]
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-8">
    <div v-for="(item, i) in items" :key="item.title" class="grid items-center gap-12 py-14 md:grid-cols-2">
      <!-- Copy -->
      <div :class="i % 2 === 1 ? 'md:order-2' : ''">
        <p class="ct-eyebrow">{{ item.eyebrow }}</p>
        <h2 class="mt-3 text-3xl text-brand-600 sm:text-4xl">{{ item.title }}</h2>
        <p class="mt-4 text-lg text-gray-600">{{ item.body }}</p>
        <ul class="mt-6 space-y-3">
          <li v-for="point in item.points" :key="point" class="flex items-start gap-3 text-gray-700">
            <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-25">
              <Check :size="14" class="text-brand-600" aria-hidden="true" />
            </span>
            {{ point }}
          </li>
        </ul>
      </div>

      <!-- Visual (decorative illustration of the feature). -->
      <div :class="i % 2 === 1 ? 'md:order-1' : ''" aria-hidden="true">
        <!-- Registration forms -->
        <div v-if="item.visual === 'forms'" class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-7">
          <p class="ct-gold-text text-xs font-bold tracking-widest uppercase">Registration</p>
          <p class="ct-display mt-1 text-xl font-semibold text-gray-900">Parish retreat sign-up</p>
          <div class="mt-5 space-y-4">
            <div v-for="label in ['Full name', 'Ministry', 'Dietary needs']" :key="label">
              <div class="text-xs text-gray-500">{{ label }}</div>
              <div class="mt-1 h-9 rounded-lg border border-gray-200 bg-gray-50"></div>
            </div>
          </div>
          <div class="mt-5 rounded-full bg-brand-600 py-3 text-center font-semibold text-white">Register</div>
        </div>

        <!-- Check-in -->
        <div v-else class="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-7 text-center">
          <p class="ct-gold-text text-xs font-bold tracking-widest uppercase">At the door</p>
          <div class="mx-auto mt-4 grid w-32 grid-cols-6 gap-1 rounded-lg border border-gray-200 p-2">
            <span
              v-for="(cell, n) in qr"
              :key="n"
              class="aspect-square rounded-sm"
              :class="cell ? 'bg-brand-600' : 'bg-transparent'"
            ></span>
          </div>
          <div
            class="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-25 px-4 py-2 text-sm font-semibold text-brand-600"
          >
            <Check :size="16" aria-hidden="true" />
            Checked in
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
