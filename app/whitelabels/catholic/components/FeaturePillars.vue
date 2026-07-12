<!-- app/whitelabels/catholic/components/FeaturePillars.vue — the organizer pitch: four arch-topped
     feature cards (Donations · Events & Tickets · Registration Forms · Easy to manage). -->
<script setup lang="ts">
import { CreditCard, FileText, LayoutGrid, Ticket } from '#icons'
import type { Component } from 'vue'

defineProps<{
  eyebrow: string
  heading: string
  subheading: string
  items: { icon: string; title: string; body: string }[]
}>()

// `donations` uses CreditCard as the nearest glyph in the curated #icons pack (see spec).
const icons: Record<string, Component> = {
  donations: CreditCard,
  tickets: Ticket,
  forms: FileText,
  manage: LayoutGrid,
}
const iconFor = (key: string): Component => icons[key] ?? Ticket
</script>

<template>
  <section class="ct-stone">
    <div class="mx-auto max-w-6xl px-6 py-24">
      <div class="mx-auto max-w-2xl text-center">
        <p class="ct-eyebrow ct-eyebrow--center">{{ eyebrow }}</p>
        <h2 class="mt-3 text-4xl text-brand-600">{{ heading }}</h2>
        <p class="mt-3 text-lg text-gray-600">{{ subheading }}</p>
      </div>
      <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="item in items" :key="item.title" class="ct-arch ct-arch--sm bg-white px-6 pt-10 pb-7 text-center">
          <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-25">
            <component :is="iconFor(item.icon)" :size="26" class="text-brand-600" aria-hidden="true" />
          </div>
          <h3 class="mt-5 text-xl text-brand-600">{{ item.title }}</h3>
          <p class="mt-2 text-sm text-gray-600">{{ item.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
