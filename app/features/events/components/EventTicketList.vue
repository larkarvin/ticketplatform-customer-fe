<!-- customer-fe/app/features/events/components/EventTicketList.vue -->
<!-- Ticket selection card: one row per ticket with a QuantityStepper, plus a single "Get tickets" CTA
     that emits the selection. The event page owns navigation to checkout. -->
<script setup lang="ts">
import { Timer } from '#icons'
import { computed, reactive } from 'vue'
import QuantityStepper from '~/features/forms/components/controls/QuantityStepper.vue'
import { isEarlyBirdActive, ticketPriceLabel } from '../ticketPricing'
import type { CheckoutSelection, PublicTicket } from '../types'

const props = defineProps<{ tickets: PublicTicket[] }>()
const emit = defineEmits<{ checkout: [CheckoutSelection[]] }>()

const qty = reactive<Record<number, number>>({})
const maxFor = (t: PublicTicket) => Math.min(t.max_per_order, t.available_quantity ?? t.max_per_order)
function dec(t: PublicTicket) {
  const next = (qty[t.id] ?? 0) - 1
  qty[t.id] = next < t.min_per_order ? 0 : next
}
function inc(t: PublicTicket) {
  const current = qty[t.id]
  qty[t.id] = current ? Math.min(maxFor(t), current + 1) : Math.min(maxFor(t), t.min_per_order)
}
const canIncrement = (t: PublicTicket) => t.is_available && t.is_on_sale && (qty[t.id] ?? 0) < maxFor(t)

const currentPrice = (t: PublicTicket) => ticketPriceLabel(t)
const showsDiscount = (t: PublicTicket) => isEarlyBirdActive(t)
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
      <li v-for="t in tickets" :key="t.id" class="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
        <div class="min-w-0">
          <p class="font-medium text-gray-900 dark:text-white">{{ t.name }}</p>
          <p class="text-sm">
            <span class="font-semibold">{{ currentPrice(t) }}</span>
            <span v-if="showsDiscount(t)" class="ml-1 text-xs text-gray-400 line-through">{{ t.price_formatted }}</span>
          </p>
          <p
            v-if="showsDiscount(t)"
            class="mt-0.5 flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400"
          >
            <Timer :size="14" aria-hidden="true" />
            Early bird
          </p>
          <p v-if="!t.is_available" class="mt-0.5 text-xs text-gray-400">Sold out</p>
          <p v-else-if="!t.is_on_sale" class="mt-0.5 text-xs text-gray-400">Not on sale yet</p>
        </div>
        <QuantityStepper
          :value="qty[t.id] ?? 0"
          :input-id="`tq-${t.id}`"
          :label="t.name"
          :can-decrement="(qty[t.id] ?? 0) > 0"
          :can-increment="canIncrement(t)"
          @decrement="dec(t)"
          @increment="inc(t)"
        />
      </li>
    </ul>
    <button
      v-if="tickets.length"
      data-testid="get-tickets"
      type="button"
      :disabled="totalQty === 0"
      class="mt-4 min-h-tap w-full rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      @click="emit('checkout', selection)"
    >
      Get tickets
      <span v-if="totalQty">· {{ totalQty }}</span>
    </button>
  </section>
</template>
