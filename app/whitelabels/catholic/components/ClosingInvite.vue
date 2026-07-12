<!-- app/whitelabels/catholic/components/ClosingInvite.vue — warm burgundy invitation band crested by a
     gold halo arch, with the organizer sign-up CTA. Hidden when the staff URL is unconfigured. -->
<script setup lang="ts">
defineProps<{ heading: string; body: string; button: string; href: string }>()
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-20">
    <div class="ct-invite relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-20 text-center">
      <h2 class="text-4xl text-white sm:text-5xl">{{ heading }}</h2>
      <p class="mx-auto mt-4 max-w-xl text-lg text-white/85">{{ body }}</p>
      <a
        :href="href || '/'"
        class="ct-focus ct-gold-btn min-h-tap mt-8 inline-flex items-center rounded-full px-8 py-4 text-lg font-semibold transition"
      >
        {{ button }}
      </a>
    </div>
  </section>
</template>
