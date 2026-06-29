<!-- customer-fe/app/features/events/components/EventTicketList.vue -->
<!-- Ticket selection card: one row per ticket with a QuantityStepper, plus a single "Get tickets" CTA
     that emits the selection. The event page owns navigation to checkout. -->
<script setup lang="ts">
import { computed, reactive } from 'vue'
import QuantityStepper from '~/features/forms/components/controls/QuantityStepper.vue'
import type { CheckoutSelection, PublicTicket } from '../types'

const props = defineProps<{ tickets: PublicTicket[] }>()
const emit = defineEmits<{ checkout: [CheckoutSelection[]] }>()

const qty = reactive<Record<number, number>>({})
const maxFor = (t: PublicTicket) => Math.min(t.max_per_order, t.available_quantity ?? t.max_per_order)
function dec(t: PublicTicket) {
  qty[t.id] = Math.max(0, (qty[t.id] ?? 0) - 1)
}
function inc(t: PublicTicket) {
  qty[t.id] = Math.min(maxFor(t), (qty[t.id] ?? 0) + 1)
}

const currentPrice = (t: PublicTicket) =>
  t.is_early_bird && t.early_bird_price_formatted ? t.early_bird_price_formatted : t.price_formatted
const selection = computed<CheckoutSelection[]>(() =>
  props.tickets.filter((t) => (qty[t.id] ?? 0) > 0).map((t) => ({ ticket_id: t.id, quantity: qty[t.id] ?? 0 }))
)
const totalQty = computed(() => selection.value.reduce((n, s) => n + s.quantity, 0))
</script>

<template>
  <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
    <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Tickets</h2>
    <p v-if="tickets.length === 0" class="text-sm text-gray-500 dark:text-gray-400">Tickets aren't available yet.</p>
    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li v-for="t in tickets" :key="t.id" class="flex items-center justify-between gap-3 py-4 first:pt-0">
        <div class="min-w-0">
          <p class="font-medium text-gray-900 dark:text-white">{{ t.name }}</p>
          <p class="text-sm">
            <span class="font-semibold">{{ currentPrice(t) }}</span>
            <span v-if="t.is_early_bird" class="ml-1 text-xs text-gray-400 line-through">{{ t.price_formatted }}</span>
          </p>
        </div>
        <QuantityStepper
          :value="qty[t.id] ?? 0"
          :input-id="`tq-${t.id}`"
          :label="t.name"
          :can-decrement="(qty[t.id] ?? 0) > 0"
          :can-increment="(qty[t.id] ?? 0) < maxFor(t)"
          @decrement="dec(t)"
          @increment="inc(t)"
        />
      </li>
    </ul>
    <button
      v-if="tickets.length"
      data-testid="get-tickets"
      type="button"
      :disabled="totalQty === 0 || undefined"
      class="mt-4 min-h-tap w-full rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      @click="emit('checkout', selection)"
    >
      Get tickets
      <span v-if="totalQty">· {{ totalQty }}</span>
    </button>
  </section>
</template>
