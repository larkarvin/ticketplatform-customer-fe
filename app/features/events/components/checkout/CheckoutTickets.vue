<!-- Editable ticket quantities: one QuantityStepper per ticket type. -->
<script setup lang="ts">
import { useT } from '#core/i18n'
import QuantityStepper from '../../../forms/components/controls/QuantityStepper.vue'
import type { PublicEvent } from '../../types'

const { t } = useT()

defineProps<{
  event: PublicEvent
  quantityOf: (ticketId: number) => number
  maxFor: (ticketId: number) => number
  onAdd: (ticketId: number) => void
  onRemoveOne: (ticketId: number) => void
}>()
</script>

<template>
  <section class="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ t('common.yourTickets') }}</h2>
    <div class="divide-y divide-gray-100 dark:divide-gray-800">
      <div
        v-for="ticket in event.tickets"
        :key="ticket.id"
        class="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
      >
        <div>
          <p class="font-medium text-gray-900 dark:text-white">{{ ticket.name }}</p>
          <p class="text-gray-500 dark:text-gray-400">{{ ticket.price_formatted }}</p>
        </div>
        <QuantityStepper
          :value="quantityOf(ticket.id)"
          :input-id="`qty-${ticket.id}`"
          :label="ticket.name"
          :can-decrement="quantityOf(ticket.id) > 0"
          :can-increment="quantityOf(ticket.id) < maxFor(ticket.id)"
          @decrement="onRemoveOne(ticket.id)"
          @increment="onAdd(ticket.id)"
        />
      </div>
    </div>
  </section>
</template>
