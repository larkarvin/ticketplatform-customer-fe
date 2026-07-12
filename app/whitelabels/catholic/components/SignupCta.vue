<script setup lang="ts">
defineProps<{ title: string; button: string; href: string; enabled: boolean }>()
</script>

<template>
  <section v-if="enabled" class="bg-brand-500">
    <div class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center">
      <h2 class="text-2xl font-semibold text-white sm:text-3xl">{{ title }}</h2>
      <a
        :href="href"
        class="inline-flex min-h-tap items-center rounded-full bg-white px-8 py-3 text-lg font-semibold text-brand-600"
      >
        {{ button }}
      </a>
    </div>
  </section>
</template>
