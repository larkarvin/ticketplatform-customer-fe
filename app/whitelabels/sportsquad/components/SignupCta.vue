<!-- app/whitelabels/sportsquad/components/SignupCta.vue — ported from demo-1's "banner-3" cover-photo
     request-form band (id="banner-3"). The request form + jQuery scroll reveal are dropped; kept as a
     single CTA button. `ArrowRight` is not exported from fe-core's lucide icon pack — substituted
     with the nearest available glyph, `ChevronRight`. -->
<script setup lang="ts">
import { ChevronRight } from '#icons'
defineProps<{ title: string; button: string; href: string; enabled: boolean }>()
</script>

<template>
  <section v-if="enabled" class="sq-cta-band sq-accent-bg">
    <div class="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center">
      <h2 class="text-3xl font-bold text-white sm:text-4xl">{{ title }}</h2>
      <a
        :href="href"
        class="inline-flex min-h-tap items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-600"
      >
        {{ button }}
        <ChevronRight :size="20" aria-hidden="true" />
      </a>
    </div>
  </section>
</template>
