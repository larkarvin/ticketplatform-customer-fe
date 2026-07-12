<!-- app/whitelabels/sportsquad/components/OrganizerPitch.vue — ported from demo-1 "hero-1" (id="hero-1"),
     the template's cover-photo hero. Below the event grid it becomes a calmer two-column pitch band:
     brand-tinted background instead of the fixed hero photo, hero-1-img.png kept as the side image. -->
<script setup lang="ts">
import { CheckCircle } from '#icons'
defineProps<{ title: string; body: string }>()
</script>

<template>
  <section class="sq-pitch">
    <div class="mx-auto flex max-w-5xl flex-col-reverse items-center gap-10 px-4 py-20 md:flex-row">
      <div class="flex-1 text-center md:text-left">
        <h2 class="text-3xl font-bold text-gray-900 sm:text-4xl">{{ title }}</h2>
        <p class="mx-auto mt-4 max-w-xl text-lg text-gray-600 md:mx-0">{{ body }}</p>
        <p class="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 md:justify-start">
          <CheckCircle :size="18" class="sq-accent" aria-hidden="true" />
          No credit card needed to get started
        </p>
      </div>
      <div class="flex-1">
        <img
          src="/whitelabels/sportsquad/hero-1-img.png"
          alt="Illustration of the SportSquad organizer dashboard"
          class="mx-auto w-full max-w-md"
        />
      </div>
    </div>
  </section>
</template>
