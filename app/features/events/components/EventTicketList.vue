<!-- customer-fe/app/features/events/components/EventTicketList.vue -->
<!-- Read-only ticket list for the public event page. The "Get tickets" CTA is intentionally inactive
     this slice; the checkout flow lands next. -->
<script setup lang="ts">
import type { PublicTicket } from '../types'

defineProps<{ tickets: PublicTicket[] }>()

function availabilityLabel(t: PublicTicket): string {
  if (!t.is_available) return 'Sold out'
  if (!t.is_on_sale) return 'Not on sale yet'
  return 'On sale'
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Tickets</h2>

    <p v-if="tickets.length === 0" class="text-gray-500 dark:text-gray-400">
      Tickets aren't available yet.
    </p>

    <ul v-else class="space-y-3">
      <li
        v-for="t in tickets"
        :key="t.id"
        class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <div class="min-w-0">
          <p class="font-medium text-gray-900 dark:text-white">{{ t.name }}</p>
          <p v-if="t.description" class="text-sm text-gray-500 dark:text-gray-400">{{ t.description }}</p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ availabilityLabel(t) }}</p>
        </div>
        <p class="shrink-0 text-lg font-semibold text-gray-900 dark:text-white">{{ t.price_formatted }}</p>
      </li>
    </ul>

    <button
      type="button"
      disabled
      class="min-h-tap w-full cursor-not-allowed rounded-xl bg-brand-500 px-6 text-base font-semibold text-white opacity-60"
    >
      Get tickets — On sale soon
    </button>
  </section>
</template>
