<!-- app/components/LegalPage.vue -->
<!-- Shared, presentational renderer for a per-whitelabel legal document (Terms, Privacy). The page
     owns the `#whitelabel` import and title; this component just renders the structured content,
     so it stays tokens-only and reusable across legal routes. -->
<script setup lang="ts">
import type { LegalDocument } from '~/whitelabels/types'

defineProps<{ doc: LegalDocument }>()
</script>

<template>
  <section class="mx-auto w-full max-w-3xl px-4 py-12">
    <h1 class="mb-2 text-2xl font-semibold text-gray-900 sm:text-3xl">{{ doc.title }}</h1>
    <p class="mb-8 text-sm text-gray-500">{{ doc.brandName }} · Last updated {{ doc.lastUpdated }}</p>

    <p v-for="(p, i) in doc.intro" :key="`intro-${i}`" class="mb-4 leading-relaxed text-gray-600">{{ p }}</p>

    <div v-for="section in doc.sections" :key="section.heading" class="mt-8">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">{{ section.heading }}</h2>
      <p v-for="(p, i) in section.paragraphs ?? []" :key="`p-${i}`" class="mb-3 leading-relaxed text-gray-600">
        {{ p }}
      </p>
      <ul v-if="section.bullets" class="mb-3 list-disc space-y-1 pl-6 leading-relaxed text-gray-600">
        <li v-for="(b, i) in section.bullets" :key="`b-${i}`">{{ b }}</li>
      </ul>
    </div>
  </section>
</template>
