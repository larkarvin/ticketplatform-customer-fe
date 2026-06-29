<!-- customer-fe/app/features/events/components/EventTicketList.vue -->
<!-- The ticket card shown beside the event (sticky on desktop). One row per ticket: name, price
     (early-bird shown with the regular price struck through) and a Buy button. Emits `buy` with the
     ticket id; the page owns what happens next (the checkout flow). -->
<script setup lang="ts">
import type { PublicTicket } from '../types'

defineProps<{ tickets: PublicTicket[] }>()
const emit = defineEmits<{ buy: [ticketId: number] }>()

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

// Early-bird is active when a lower price is set and its window hasn't closed.
function isEarlyBird(t: PublicTicket): boolean {
  if (t.early_bird_price == null) return false
  if (!t.early_bird_ends_at) return true
  return new Date(t.early_bird_ends_at).getTime() > Date.now()
}

function currentPrice(t: PublicTicket): string {
  return isEarlyBird(t) && t.early_bird_price != null ? money(t.early_bird_price, t.currency) : t.price_formatted
}

function buyable(t: PublicTicket): boolean {
  return t.is_available && t.is_on_sale
}

function statusLabel(t: PublicTicket): string {
  if (!t.is_available) return 'Sold out'
  if (!t.is_on_sale) return 'Not on sale yet'
  return ''
}
</script>

<template>
  <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
    <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Tickets</h2>

    <p v-if="tickets.length === 0" class="text-sm text-gray-500 dark:text-gray-400">Tickets aren't available yet.</p>

    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li v-for="t in tickets" :key="t.id" class="space-y-2 py-4 first:pt-0 last:pb-0">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium text-gray-900 dark:text-white">{{ t.name }}</p>
            <p v-if="t.description" class="text-sm text-gray-500 dark:text-gray-400">{{ t.description }}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ currentPrice(t) }}</p>
            <p v-if="isEarlyBird(t)" class="text-xs text-gray-400 line-through">{{ t.price_formatted }}</p>
          </div>
        </div>

        <button
          type="button"
          :disabled="!buyable(t)"
          class="min-h-tap w-full rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="emit('buy', t.id)"
        >
          {{ buyable(t) ? 'Buy ticket' : statusLabel(t) }}
        </button>
      </li>
    </ul>
  </section>
</template>
