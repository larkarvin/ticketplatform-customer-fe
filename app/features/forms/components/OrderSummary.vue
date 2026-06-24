<script setup lang="ts">
// Server-computed price breakdown on the Review step: line items + fees + total. Presentational —
// the composable owns the fetch; money is never computed here.
import type { PaymentBreakdown } from '~/features/forms/types'

defineProps<{ breakdown: PaymentBreakdown }>()

const money = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`
</script>

<template>
  <section class="rounded-xl border border-gray-200 p-4 sm:p-5">
    <h3 class="mb-3 text-base font-semibold text-gray-900">Order summary</h3>
    <dl class="space-y-2 text-base">
      <div v-for="(item, i) in breakdown.items" :key="`i${i}`" class="flex justify-between gap-3">
        <dt class="text-gray-700">
          {{ item.option_label || item.field_label }}
          <span v-if="item.quantity > 1" class="text-gray-500">× {{ item.quantity }}</span>
        </dt>
        <dd class="shrink-0 tabular-nums text-gray-900">{{ money(item.amount, breakdown.currency) }}</dd>
      </div>
      <div v-for="(fee, i) in breakdown.fees" :key="`f${i}`" class="flex justify-between gap-3">
        <dt class="text-gray-700">{{ fee.label }}</dt>
        <dd class="shrink-0 tabular-nums text-gray-900">{{ money(fee.amount, breakdown.currency) }}</dd>
      </div>
    </dl>
    <div class="mt-3 flex items-baseline justify-between gap-3 border-t border-gray-200 pt-3">
      <span class="text-lg font-semibold text-gray-900">Total</span>
      <span class="text-lg font-semibold tabular-nums text-gray-900">
        {{ money(breakdown.total, breakdown.currency) }}
      </span>
    </div>
  </section>
</template>
