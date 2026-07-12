<!-- app/whitelabels/sportsquad/components/ValuePoints.vue — ported from demo-1's "statistic-1" digit
     blocks (id="statistic-1"): three stat/label pairs in a row. Counter-animation JS dropped (static
     values); numeric "89k / 76% / 4.93" digits replaced with sportsquad's own value words per content.ts. -->
<script setup lang="ts">
defineProps<{ values: { stat: string; label: string }[] }>()
</script>

<template>
  <section class="border-y border-gray-100 bg-gray-50">
    <div class="mx-auto grid max-w-5xl gap-8 px-4 py-16 text-center sm:grid-cols-3">
      <div v-for="v in values" :key="v.label">
        <p class="sq-stat-number sq-accent text-4xl font-bold">{{ v.stat }}</p>
        <p class="mt-2 text-gray-600">{{ v.label }}</p>
      </div>
    </div>
  </section>
</template>
