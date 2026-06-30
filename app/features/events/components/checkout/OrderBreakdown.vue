<!-- Non-collapsible order breakdown for the review step: items + fees + taxes + grand total. -->
<script setup lang="ts">
import { Pencil } from '#icons'
import { computed } from 'vue'
import { formatMoney } from '../../money'
import type { OrderCalculation } from '../../types'

const props = defineProps<{
  calculation: OrderCalculation | null
  status: 'idle' | 'updating' | 'error'
  /** Show an Edit link in the header (review step → back to the tickets section). */
  editable?: boolean
}>()
const emit = defineEmits<{ edit: [] }>()

const money = (amount: number, currency: string): string => formatMoney(amount, currency)
const totalText = computed(() => (props.calculation ? money(props.calculation.total, props.calculation.currency) : '—'))
</script>

<template>
  <section class="rounded-xl border border-gray-200 p-4 sm:p-5 dark:border-gray-700">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Order summary</h3>
      <button
        v-if="editable"
        type="button"
        data-test="edit-order"
        class="inline-flex min-h-tap items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-300"
        @click="emit('edit')"
      >
        <Pencil :size="15" />
        Edit
      </button>
    </div>
    <template v-if="calculation">
      <ul class="space-y-2 text-sm">
        <li v-for="(item, i) in calculation.items" :key="`i${i}`" class="flex justify-between gap-3">
          <span class="text-gray-700 dark:text-gray-300">
            {{ item.label }}
            <span v-if="item.quantity > 1" class="text-gray-500">× {{ item.quantity }}</span>
          </span>
          <span class="shrink-0 tabular-nums text-gray-900 dark:text-white">
            {{ money(item.amount, calculation.currency) }}
          </span>
        </li>
        <li v-for="(fee, i) in calculation.fees" :key="`f${i}`" class="flex justify-between gap-3">
          <span class="text-gray-600 dark:text-gray-400">{{ fee.label }}</span>
          <span class="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
            {{ money(fee.amount, calculation.currency) }}
          </span>
        </li>
        <li v-for="(tax, i) in calculation.taxes" :key="`t${i}`" class="flex justify-between gap-3">
          <span class="text-gray-600 dark:text-gray-400">{{ tax.label }}</span>
          <span class="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
            {{ money(tax.amount, calculation.currency) }}
          </span>
        </li>
      </ul>
      <div class="mt-3 flex items-baseline justify-between gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
        <span class="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
        <span class="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{{ totalText }}</span>
      </div>
    </template>
    <p v-else-if="status === 'updating'" class="text-sm text-gray-400 dark:text-gray-500" aria-live="polite">
      Updating…
    </p>
    <p v-else class="text-sm text-gray-400 dark:text-gray-500">No items yet.</p>
  </section>
</template>
