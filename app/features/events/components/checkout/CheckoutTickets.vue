<!-- Read-only summary of the buyer's chosen tickets: name × qty, line totals. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { CheckoutSelection, PublicEvent } from '../../types'

const props = defineProps<{
  event: PublicEvent
  selection: CheckoutSelection[]
}>()

interface LineItem {
  name: string
  quantity: number
  unit_price: string
  subtotal: string
}

const lines = computed<LineItem[]>(() =>
  props.selection.map((sel) => {
    const ticket = props.event.tickets.find((t) => t.id === sel.ticket_id)
    const price = ticket?.price ?? 0
    const formatted = ticket?.price_formatted ?? ''
    const subtotal = (price * sel.quantity).toFixed(2)
    return {
      name: ticket?.name ?? 'Ticket',
      quantity: sel.quantity,
      unit_price: formatted,
      subtotal: `${props.event.currency} ${subtotal}`,
    }
  })
)
</script>

<template>
  <section class="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your tickets</h2>
    <ul class="divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="(line, i) in lines"
        :key="i"
        class="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
      >
        <div>
          <p class="font-medium text-gray-900 dark:text-white">{{ line.name }}</p>
          <p class="text-gray-500 dark:text-gray-400">{{ line.unit_price }} × {{ line.quantity }}</p>
        </div>
        <span class="font-semibold text-gray-900 dark:text-white">{{ line.subtotal }}</span>
      </li>
    </ul>
  </section>
</template>
