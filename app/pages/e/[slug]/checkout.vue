<!-- customer-fe/app/pages/e/[slug]/checkout.vue -->
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { usePublicEvent } from '~/features/events'
import { hasData, parseSelection } from '~/features/events/cart'
// Merch/donation add-ons deferred to a follow-up slice.
import CheckoutAttendees from '~/features/events/components/checkout/CheckoutAttendees.vue'
import CheckoutBuyer from '~/features/events/components/checkout/CheckoutBuyer.vue'
import CheckoutSummary from '~/features/events/components/checkout/CheckoutSummary.vue'
import CheckoutTickets from '~/features/events/components/checkout/CheckoutTickets.vue'
import { useCart } from '~/features/events/composables/useCart'
import { usePublicCheckout } from '~/features/events/composables/usePublicCheckout'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug))
const { event } = await usePublicEvent(slug.value)

const cartStore = useCart(event, parseSelection(route.query.tickets))
// Pass the cart Ref so usePublicCheckout can build the calculate payload from instances.
const c = usePublicCheckout(event, cartStore.cart)

// URL sync: keep ?tickets= in sync whenever the cart changes, then recalc totals.
watch(
  cartStore.cart,
  () => {
    router.replace({ query: { ...route.query, tickets: cartStore.serializeToQuery() } })
    c.recalcTotals()
  },
  { deep: true }
)

// Trigger the initial price preview after hydration to avoid SSR double-fetch.
onMounted(() => c.recalcTotals())

// Confirm before removing an instance that has entered participant data.
function requestRemove(uid: string): void {
  if (
    hasData(cartStore.cart.value, uid) &&
    !window.confirm("Remove this ticket? You'll lose the names and add-ons entered.")
  )
    return
  cartStore.removeTicket(uid)
}

// Remove the most-recently-added instance of a given ticket type (stepper decrement).
function onRemoveOne(ticketId: number): void {
  const last = [...cartStore.cart.value].reverse().find((inst) => inst.ticket_id === ticketId)
  if (last) requestRemove(last.uid)
}

// First required text-like field for the ticket, used as identity key in ParticipantGroup.
function identityKeyFor(ticketId: number): string | null {
  const t = event.tickets.find((x) => x.id === ticketId)
  const f = (t?.participant_fields ?? []).find((x) => x.required && ['text', 'name'].includes(x.type))
  return f?.field_key ?? t?.participant_fields?.[0]?.field_key ?? null
}
</script>

<template>
  <article class="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout — {{ event.title }}</h1>

    <!-- Empty/invalid selection → send them back to pick tickets -->
    <p v-if="cartStore.cart.value.length === 0" class="text-gray-600 dark:text-gray-300">
      No tickets selected.
      <NuxtLink :to="`/e/${slug}`" class="text-brand-500 underline">Choose tickets</NuxtLink>
    </p>

    <template v-else>
      <CheckoutTickets
        :event="event"
        :quantity-of="cartStore.quantityOf"
        :max-for="cartStore.maxFor"
        :on-add="cartStore.addTicket"
        :on-remove-one="onRemoveOne"
      />
      <CheckoutAttendees
        :event="event"
        :cart="cartStore.cart.value"
        :identity-key-for="identityKeyFor"
        :errors="c.fieldErrors.value"
        :buyer-name="c.buyer.name"
        @remove="requestRemove"
      />
      <CheckoutBuyer :buyer="c.buyer" />
      <CheckoutSummary :calculation="c.calculation.value" :status="c.totalsStatus.value" @retry="c.recalcTotals" />
    </template>
  </article>
</template>
