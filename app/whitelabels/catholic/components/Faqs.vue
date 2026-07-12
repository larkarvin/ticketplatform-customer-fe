<!-- app/whitelabels/catholic/components/Faqs.vue — common questions as a native <details> accordion
     (SSR-safe, works without client JS). -->
<script setup lang="ts">
import { ChevronDown } from '#icons'

defineProps<{ eyebrow: string; heading: string; items: { q: string; a: string }[] }>()
</script>

<template>
  <section class="ct-stone">
    <div class="mx-auto max-w-3xl px-6 py-24">
      <div class="text-center">
        <p class="ct-eyebrow ct-eyebrow--center">{{ eyebrow }}</p>
        <h2 class="mt-3 text-4xl text-brand-600">{{ heading }}</h2>
      </div>
      <div class="mt-10 space-y-4">
        <details
          v-for="(item, i) in items"
          :key="item.q"
          :open="i === 0"
          class="group rounded-2xl border border-gray-200 bg-white p-6"
        >
          <summary
            class="ct-display flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-brand-600"
          >
            {{ item.q }}
            <ChevronDown
              :size="20"
              class="ct-gold-text shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p class="mt-3 text-gray-600">{{ item.a }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
