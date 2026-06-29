<!-- Checkout section: server-calculated order total + itemised breakdown.
     Pay CTA is disabled this slice — placement is deferred. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { OrderCalculation } from '../../types'

const props = defineProps<{
  calculation: OrderCalculation | null
  status: 'idle' | 'updating' | 'error'
}>()

const emit = defineEmits<{ retry: [] }>()

const totalText = computed(() =>
  props.calculation ? `${props.calculation.currency} ${props.calculation.total.toFixed(2)}` : '—'
)
</script>

<template>
  <section class="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Order summary</h2>

    <!-- Items -->
    <ul v-if="calculation && calculation.items.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="(item, i) in calculation.items"
        :key="i"
        class="flex items-center justify-between gap-3 py-2 text-sm first:pt-0"
      >
        <span class="text-gray-700 dark:text-gray-300">{{ item.label }}</span>
        <span class="font-medium tabular-nums text-gray-900 dark:text-white">
          {{ calculation.currency }} {{ item.amount.toFixed(2) }}
        </span>
      </li>
    </ul>

    <!-- Fees -->
    <ul
      v-if="calculation && calculation.fees.length > 0"
      class="space-y-1 border-t border-gray-100 pt-3 dark:border-gray-800"
    >
      <li v-for="(fee, i) in calculation.fees" :key="i" class="flex items-center justify-between gap-3 text-sm">
        <span class="text-gray-600 dark:text-gray-400">{{ fee.label }}</span>
        <span class="tabular-nums text-gray-700 dark:text-gray-300">
          {{ calculation.currency }} {{ fee.amount.toFixed(2) }}
        </span>
      </li>
    </ul>

    <!-- Taxes -->
    <ul
      v-if="calculation && calculation.taxes.length > 0"
      class="space-y-1 border-t border-gray-100 pt-3 dark:border-gray-800"
    >
      <li v-for="(tax, i) in calculation.taxes" :key="i" class="flex items-center justify-between gap-3 text-sm">
        <span class="text-gray-600 dark:text-gray-400">{{ tax.label }}</span>
        <span class="tabular-nums text-gray-700 dark:text-gray-300">
          {{ calculation.currency }} {{ tax.amount.toFixed(2) }}
        </span>
      </li>
    </ul>

    <!-- Updating overlay (reserved space — no layout shift) -->
    <div
      v-if="status === 'updating'"
      class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700"
      aria-live="polite"
    >
      <span class="text-base font-semibold text-gray-900 dark:text-white">Total</span>
      <span class="text-sm text-gray-400 dark:text-gray-500">Updating…</span>
    </div>

    <!-- Error retry row -->
    <div
      v-else-if="status === 'error'"
      class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700"
    >
      <span class="text-sm text-danger-600 dark:text-danger-400">Couldn't update total</span>
      <button
        type="button"
        data-retry
        class="text-sm font-medium text-brand-500 underline hover:text-brand-600"
        @click="emit('retry')"
      >
        Retry
      </button>
    </div>

    <!-- Total row (idle / has a calculation) -->
    <div v-else class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
      <span class="text-base font-semibold text-gray-900 dark:text-white">Total</span>
      <span class="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{{ totalText }}</span>
    </div>

    <!-- Pay CTA — disabled until the payment slice lands -->
    <button
      type="button"
      disabled
      class="mt-2 min-h-tap w-full cursor-not-allowed rounded-xl bg-brand-500 px-6 text-base font-semibold text-white opacity-50"
    >
      Payment coming soon
    </button>
  </section>
</template>
