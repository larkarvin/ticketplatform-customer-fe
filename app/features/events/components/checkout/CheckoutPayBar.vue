<!-- Sticky bottom bar: running total + disabled pay CTA (payment deferred). -->
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
  <div
    class="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
      <!-- Total -->
      <div class="min-w-0">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
        <p
          v-if="status === 'updating'"
          class="text-sm text-gray-400 dark:text-gray-500"
          aria-live="polite"
          aria-atomic="true"
        >
          Updating…
        </p>
        <p v-else class="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
          {{ totalText }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-shrink-0 items-center gap-3">
        <span v-if="status === 'error'" class="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400">
          Couldn't update total
          <button
            type="button"
            data-retry
            class="font-medium text-brand-500 underline hover:text-brand-600"
            @click="emit('retry')"
          >
            Retry
          </button>
        </span>
        <button
          type="button"
          disabled
          class="min-h-tap cursor-not-allowed rounded-xl bg-brand-500 px-6 text-base font-semibold text-white opacity-50"
        >
          Payment coming soon
        </button>
      </div>
    </div>
  </div>
</template>
