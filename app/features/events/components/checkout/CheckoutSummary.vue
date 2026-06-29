<!-- Checkout section: order total + the single Pay CTA. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { CheckoutSelection, PublicEvent } from '../../types'

const props = defineProps<{
  event: PublicEvent
  selection: CheckoutSelection[]
  total: number
  canPay: boolean
  submitting: boolean
}>()

const emit = defineEmits<{ pay: [] }>()

const totalFormatted = computed(() => `${props.event.currency} ${props.total.toFixed(2)}`)

interface LineItem {
  name: string
  quantity: number
  subtotal: string
}

const lines = computed<LineItem[]>(() =>
  props.selection.map((sel) => {
    const ticket = props.event.tickets.find((t) => t.id === sel.ticket_id)
    const price = ticket?.price ?? 0
    return {
      name: ticket?.name ?? 'Ticket',
      quantity: sel.quantity,
      subtotal: `${props.event.currency} ${(price * sel.quantity).toFixed(2)}`,
    }
  })
)
</script>

<template>
  <section class="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Order summary</h2>

    <ul class="divide-y divide-gray-100 dark:divide-gray-800">
      <li v-for="(line, i) in lines" :key="i" class="flex items-center justify-between gap-3 py-2 text-sm first:pt-0">
        <span class="text-gray-700 dark:text-gray-300">{{ line.name }} × {{ line.quantity }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ line.subtotal }}</span>
      </li>
    </ul>

    <div class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
      <span class="text-base font-semibold text-gray-900 dark:text-white">Total</span>
      <span class="text-lg font-bold text-gray-900 dark:text-white">{{ totalFormatted }}</span>
    </div>

    <button
      type="button"
      :disabled="!canPay"
      class="mt-2 min-h-tap w-full rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      @click="emit('pay')"
    >
      <span v-if="submitting" class="inline-flex items-center gap-2">
        <span
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          aria-hidden="true"
        />
        Processing…
      </span>
      <span v-else>Pay {{ totalFormatted }}</span>
    </button>
  </section>
</template>
