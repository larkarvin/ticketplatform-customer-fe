<!-- app/whitelabels/catholic/components/Hero.vue — warm dual-audience hero: welcome copy + two CTAs
     on the left, the wooden-framed parish-events board (passed via the default slot) on the right. -->
<script setup lang="ts">
defineProps<{ eyebrow: string; heading: string; lead: string; browse: string; setUp: string; setUpHref: string }>()
</script>

<template>
  <section class="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-2">
    <div>
      <p class="ct-eyebrow">{{ eyebrow }}</p>
      <h1 class="mt-4 text-5xl text-brand-600 sm:text-6xl">{{ heading }}</h1>
      <p class="mt-5 max-w-md text-xl text-gray-600">{{ lead }}</p>
      <div class="mt-8 flex flex-wrap gap-4">
        <NuxtLink
          to="/events"
          class="ct-focus min-h-tap inline-flex items-center rounded-full bg-brand-600 px-6 py-3.5 font-semibold text-white transition hover:bg-brand-700"
        >
          {{ browse }}
        </NuxtLink>
        <a
          :href="setUpHref || '/'"
          class="ct-focus min-h-tap inline-flex items-center rounded-full border border-gray-300 px-6 py-3.5 font-semibold text-brand-600 transition hover:border-brand-600 hover:bg-gray-100"
        >
          {{ setUp }}
        </a>
      </div>
    </div>
    <div id="events" class="scroll-mt-24"><slot /></div>
  </section>
</template>
