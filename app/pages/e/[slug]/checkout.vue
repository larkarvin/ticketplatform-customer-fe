<!-- customer-fe/app/pages/e/[slug]/checkout.vue -->
<script setup lang="ts">
import { ChevronDown } from '#icons'
import { computed, onMounted, ref, watch } from 'vue'
import { usePublicEvent } from '~/features/events'
import { hasData, parseSelection, selectionKey } from '~/features/events/cart'
import CheckoutAddOns from '~/features/events/components/checkout/CheckoutAddOns.vue'
import CheckoutAttendees from '~/features/events/components/checkout/CheckoutAttendees.vue'
import CheckoutBuyer from '~/features/events/components/checkout/CheckoutBuyer.vue'
import CheckoutPayBar from '~/features/events/components/checkout/CheckoutPayBar.vue'
import CheckoutTickets from '~/features/events/components/checkout/CheckoutTickets.vue'
import { useCart } from '~/features/events/composables/useCart'
import { useCheckoutPersistence } from '~/features/events/composables/useCheckoutPersistence'
import { usePublicCheckout } from '~/features/events/composables/usePublicCheckout'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug))
const { event } = await usePublicEvent(slug.value)

const cartStore = useCart(event, parseSelection(route.query.tickets))
const c = usePublicCheckout(event, cartStore.cart)
const persistence = useCheckoutPersistence(slug.value)

const summaryOpen = ref(true)

const totalText = computed(() =>
  c.calculation.value ? `${c.calculation.value.currency} ${c.calculation.value.total.toFixed(2)}` : '—'
)

// URL sync: keep ?tickets= in sync whenever the cart changes, then recalc totals.
watch(
  cartStore.cart,
  () => {
    router.replace({ query: { ...route.query, tickets: cartStore.serializeToQuery() } })
    c.recalcTotals()
  },
  { deep: true }
)

// Autosave: debounced persist on any cart, answers, or buyer changes.
watch(
  [cartStore.cart, c.checkoutAnswers, c.buyer],
  () => {
    persistence.save({
      tickets: cartStore.cart.value,
      checkoutAnswers: { ...c.checkoutAnswers },
      email: c.buyer.email,
    })
  },
  { deep: true }
)

// Restore from localStorage draft on mount (SSR-safe: localStorage is client-only).
// The URL ?tickets= selection always wins for WHICH tickets — only restore the draft's
// cart (with filled participant details) when it matches the current selection, i.e. a
// refresh-resume. A new/different selection from the event page is never clobbered by a
// stale draft. Add-on answers + email are selection-independent, so always restore them.
onMounted(() => {
  const draft = persistence.restore()
  if (draft) {
    const draftTickets = draft.tickets.filter((t) => cartStore.ticketDef(t.ticket_id) !== undefined)
    if (selectionKey(draftTickets) === selectionKey(cartStore.cart.value)) {
      cartStore.replaceCart(draftTickets)
    }
    for (const key of Object.keys(c.checkoutAnswers)) {
      Reflect.deleteProperty(c.checkoutAnswers, key)
    }
    Object.assign(c.checkoutAnswers, draft.checkoutAnswers)
    c.buyer.email = draft.email
  }
  c.recalcTotals()
})

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

// Clear the draft and reload to re-seed from the URL ?tickets= param.
function startOver(): void {
  const hasEnteredData =
    cartStore.cart.value.some((inst) => hasData(cartStore.cart.value, inst.uid)) || c.buyer.email !== ''
  if (hasEnteredData && !window.confirm('Start over? This will clear all your entered details.')) return
  persistence.clear()
  window.location.reload()
}
</script>

<template>
  <div class="mx-auto w-full max-w-3xl">
    <!-- Empty/invalid selection → send them back to pick tickets -->
    <p v-if="cartStore.cart.value.length === 0" class="px-4 py-8 text-gray-600 dark:text-gray-300">
      No tickets selected.
      <NuxtLink :to="`/e/${slug}`" class="text-brand-500 underline">Choose tickets</NuxtLink>
    </p>

    <template v-else>
      <!-- 1. Pinned order summary (sticky top, collapsible) -->
      <div class="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div class="px-4">
          <!-- Summary header row: always visible -->
          <div class="flex items-center gap-2 py-3">
            <button
              type="button"
              :aria-expanded="summaryOpen"
              aria-controls="checkout-summary-panel"
              class="flex min-h-tap flex-1 items-center gap-2 text-left"
              @click="summaryOpen = !summaryOpen"
            >
              <ChevronDown
                :size="18"
                class="flex-shrink-0 text-gray-500 transition-transform duration-200"
                :class="summaryOpen ? 'rotate-180' : ''"
              />
              <span class="font-semibold text-gray-900 dark:text-white">Order summary</span>
              <span
                v-if="c.totalsStatus.value === 'updating'"
                class="ml-auto text-sm text-gray-400 dark:text-gray-500"
                aria-live="polite"
              >
                Updating…
              </span>
              <span v-else class="ml-auto text-base font-bold tabular-nums text-gray-900 dark:text-white">
                {{ totalText }}
              </span>
            </button>
            <button
              type="button"
              class="ml-1 flex-shrink-0 text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="startOver"
            >
              Start over
            </button>
          </div>

          <!-- Collapsible itemised breakdown -->
          <div v-show="summaryOpen" id="checkout-summary-panel" class="pb-3">
            <ul
              v-if="c.calculation.value && c.calculation.value.items.length > 0"
              class="divide-y divide-gray-100 dark:divide-gray-800"
            >
              <li
                v-for="(item, i) in c.calculation.value.items"
                :key="i"
                class="flex items-center justify-between gap-3 py-2 text-sm first:pt-0"
              >
                <span class="text-gray-700 dark:text-gray-300">
                  {{ item.label }}
                  <span v-if="item.quantity > 1" class="text-gray-500">× {{ item.quantity }}</span>
                </span>
                <span class="font-medium tabular-nums text-gray-900 dark:text-white">
                  {{ c.calculation.value.currency }} {{ item.amount.toFixed(2) }}
                </span>
              </li>
            </ul>
            <ul
              v-if="c.calculation.value && c.calculation.value.fees.length > 0"
              class="space-y-1 border-t border-gray-100 pt-2 dark:border-gray-800"
            >
              <li
                v-for="(fee, i) in c.calculation.value.fees"
                :key="i"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="text-gray-600 dark:text-gray-400">{{ fee.label }}</span>
                <span class="tabular-nums text-gray-700 dark:text-gray-300">
                  {{ c.calculation.value.currency }} {{ fee.amount.toFixed(2) }}
                </span>
              </li>
            </ul>
            <ul
              v-if="c.calculation.value && c.calculation.value.taxes.length > 0"
              class="space-y-1 border-t border-gray-100 pt-2 dark:border-gray-800"
            >
              <li
                v-for="(tax, i) in c.calculation.value.taxes"
                :key="i"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="text-gray-600 dark:text-gray-400">{{ tax.label }}</span>
                <span class="tabular-nums text-gray-700 dark:text-gray-300">
                  {{ c.calculation.value.currency }} {{ tax.amount.toFixed(2) }}
                </span>
              </li>
            </ul>
            <p
              v-if="!c.calculation.value && c.totalsStatus.value === 'idle'"
              class="text-sm text-gray-400 dark:text-gray-500"
            >
              No items yet.
            </p>
          </div>
        </div>
      </div>

      <!-- 2. Page sections (pb-32 reserves space for the fixed bottom bar) -->
      <article class="space-y-8 px-4 pb-32 pt-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout — {{ event.title }}</h1>

        <!-- Your tickets -->
        <CheckoutTickets
          :event="event"
          :quantity-of="cartStore.quantityOf"
          :max-for="cartStore.maxFor"
          :on-add="cartStore.addTicket"
          :on-remove-one="onRemoveOne"
        />

        <!-- Who's attending -->
        <CheckoutAttendees
          :event="event"
          :cart="cartStore.cart.value"
          :identity-key-for="identityKeyFor"
          :errors="c.fieldErrors.value"
          @remove="requestRemove"
          @add-participant="cartStore.addParticipant"
          @remove-participant="(uid, i) => cartStore.removeParticipant(uid, i)"
        />

        <!-- Add-ons (hidden when the event has no order-level fields) -->
        <CheckoutAddOns
          v-if="event.form_fields && event.form_fields.length > 0"
          :fields="event.form_fields"
          :answers="c.checkoutAnswers"
          :errors="c.fieldErrors.value"
        />

        <!-- Your details -->
        <CheckoutBuyer :buyer="c.buyer" />
      </article>

      <!-- 3. Sticky bottom pay bar (fixed, always visible while scrolling) -->
      <CheckoutPayBar :calculation="c.calculation.value" :status="c.totalsStatus.value" @retry="c.recalcTotals" />
    </template>
  </div>
</template>
