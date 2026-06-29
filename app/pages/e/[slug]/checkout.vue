<!-- customer-fe/app/pages/e/[slug]/checkout.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { usePublicEvent } from '~/features/events'
import CheckoutAddOns from '~/features/events/components/checkout/CheckoutAddOns.vue'
import CheckoutAttendees from '~/features/events/components/checkout/CheckoutAttendees.vue'
import CheckoutBuyer from '~/features/events/components/checkout/CheckoutBuyer.vue'
import CheckoutSummary from '~/features/events/components/checkout/CheckoutSummary.vue'
import CheckoutTickets from '~/features/events/components/checkout/CheckoutTickets.vue'
import { usePublicCheckout } from '~/features/events/composables/usePublicCheckout'
import type { CheckoutSelection } from '~/features/events/types'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { event } = await usePublicEvent(slug.value)

// Parse ?tickets=id:qty,id:qty (refresh-safe). Clamp to real, available tickets.
const selection = computed<CheckoutSelection[]>(() =>
  String(route.query.tickets ?? '')
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const [id, q] = p.split(':')
      return { ticket_id: Number(id), quantity: Number(q) }
    })
    .filter((s) => s.quantity > 0 && event.tickets.some((t) => t.id === s.ticket_id))
)

const c = usePublicCheckout(event, selection.value)
</script>

<template>
  <article class="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout — {{ event.title }}</h1>

    <!-- Empty/invalid selection → send them back to pick tickets -->
    <p v-if="selection.length === 0" class="text-gray-600 dark:text-gray-300">
      No tickets selected.
      <NuxtLink :to="`/e/${slug}`" class="text-brand-500 underline">Choose tickets</NuxtLink>
    </p>

    <template v-else>
      <CheckoutTickets :event="event" :selection="selection" />
      <CheckoutAttendees
        :tickets="event.tickets"
        :selection="selection"
        :answers="c.attendeeAnswers"
        :errors="c.fieldErrors.value"
      />
      <CheckoutAddOns :fields="event.form_fields ?? []" :answers="c.checkoutAnswers" :errors="c.fieldErrors.value" />
      <CheckoutBuyer :buyer="c.buyer" />
      <CheckoutSummary
        :event="event"
        :selection="selection"
        :total="c.total.value"
        :can-pay="c.canPay.value"
        :submitting="c.submitting.value"
        @pay="c.pay"
      />
    </template>
  </article>
</template>
