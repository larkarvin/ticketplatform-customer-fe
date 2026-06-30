<!-- customer-fe/app/pages/e/[slug]/checkout.vue -->
<script setup lang="ts">
import { useConfirm } from '#core/composables/useConfirm'
import { Lock } from '#icons'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePublicEvent } from '~/features/events'
import { hasAnswer } from '~/features/events/answers'
import { hasData, parseSelection, selectionKey } from '~/features/events/cart'
import {
  EDIT_ADDONS,
  EDIT_ATTENDEES,
  EDIT_TICKETS,
  buildReviewGroups,
  firstOrderEmail,
} from '~/features/events/checkoutReview'
import CheckoutAddOns from '~/features/events/components/checkout/CheckoutAddOns.vue'
import CheckoutAttendees from '~/features/events/components/checkout/CheckoutAttendees.vue'
import CheckoutPayBar from '~/features/events/components/checkout/CheckoutPayBar.vue'
import CheckoutReview from '~/features/events/components/checkout/CheckoutReview.vue'
import CheckoutTickets from '~/features/events/components/checkout/CheckoutTickets.vue'
import { useCart } from '~/features/events/composables/useCart'
import { useCheckoutPersistence } from '~/features/events/composables/useCheckoutPersistence'
import { usePublicCheckout } from '~/features/events/composables/usePublicCheckout'
import { identityKey } from '~/features/events/identityKey'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug))
const { event } = await usePublicEvent(slug.value)

const cartStore = useCart(event, parseSelection(route.query.tickets))
const c = usePublicCheckout(event, cartStore.cart)
const { placeAndPay, submitting, submitError } = c
const persistence = useCheckoutPersistence(slug.value)
const { confirm } = useConfirm()

const view = ref<'entry' | 'review'>('entry')
const reviewGroups = computed(() => buildReviewGroups(event, cartStore.cart.value, c.checkoutAnswers))

// An order is checkout-able with a ticket OR just an optional extra (e.g. a donation / merch), so the
// buyer can check out with extras alone.
const hasExtras = computed(() => Object.values(c.checkoutAnswers).some(hasAnswer))
const hasContent = computed(() => cartStore.cart.value.length > 0 || hasExtras.value)

// Step swap modelled as a single pushed history state so phone/browser back returns to entry
// (never the event page). On-screen Back and Edit also go through history.back() → popstate for one
// consistent path. pendingScroll carries the Edit target so we can scroll after landing on entry.
const pendingScroll = ref<number | null>(null)

function goToReview(): void {
  if (!hasContent.value) return // nothing to review yet (no tickets and no extras)
  if (!c.validate()) {
    scrollToFirstError()
    return
  }
  // Pre-fill the receipt email from the first email already entered in the order (typically the buyer's
  // on Participant 1). Only when still blank, so a typed-in or restored value is never overwritten.
  if (c.buyer.email === '') c.buyer.email = firstOrderEmail(event, cartStore.cart.value, c.checkoutAnswers)
  // Merge our marker into Vue Router's existing history.state rather than replacing it, so the
  // router's own nav metadata (position index, scroll restoration) survives the back/forward round-trip.
  if (typeof window !== 'undefined')
    window.history.pushState({ ...(window.history.state ?? {}), checkoutView: 'review' }, '')
  view.value = 'review'
  if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
}

function applyLeaveReview(): void {
  view.value = 'entry'
  const target = pendingScroll.value
  pendingScroll.value = null
  if (target === null) return
  const id =
    target === EDIT_TICKETS
      ? 'checkout-tickets'
      : target === EDIT_ATTENDEES
        ? 'checkout-attendees'
        : target === EDIT_ADDONS
          ? 'checkout-addons'
          : null
  if (!id) return
  void nextTick(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function leaveReview(scrollTarget: number | null): void {
  pendingScroll.value = scrollTarget
  if (typeof window !== 'undefined' && window.history.state?.checkoutView === 'review') {
    window.history.back() // → popstate → applyLeaveReview()
  } else {
    applyLeaveReview()
  }
}

function onPopState(): void {
  // Back from review → entry; Forward back into the review marker → restore review. Keeps the on-screen
  // view in sync with the history entry in both directions.
  if (view.value === 'review') applyLeaveReview()
  else if (window.history.state?.checkoutView === 'review') view.value = 'review'
}

function scrollToFirstError(): void {
  // validateCheckout only produces attendee errors (uid.index.field_key keys), so
  // 'checkout-attendees' is always the right target — the 'checkout-addons' branch was unreachable.
  void nextTick(() =>
    document.getElementById('checkout-attendees')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  )
}

// URL sync: keep ?tickets= in sync whenever the cart changes, then recalc totals.
watch(
  cartStore.cart,
  () => {
    router.replace({ query: { ...route.query, tickets: cartStore.serializeToQuery() } })
    c.recalcTotals()
  },
  { deep: true }
)

// Recalc totals whenever add-on / checkout-field answers change — priced add-ons
// (merch, donations) are sent in the calc payload so the server returns updated line
// items; without this watch the displayed Total stays stale after an answer change.
watch(c.checkoutAnswers, () => c.recalcTotals(), { deep: true })

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
  window.addEventListener('popstate', onPopState)
})
onBeforeUnmount(() => {
  window.removeEventListener('popstate', onPopState)
})

// Confirm before removing an instance that has entered participant data.
async function requestRemove(uid: string): Promise<void> {
  if (hasData(cartStore.cart.value, uid)) {
    const ok = await confirm({
      title: 'Remove this ticket?',
      message: "You'll lose the names and add-ons entered for it.",
      confirmLabel: 'Remove ticket',
    })
    if (!ok) return
  }
  cartStore.removeTicket(uid)
}

// Remove the most-recently-added instance of a given ticket type (stepper decrement).
function onRemoveOne(ticketId: number): void {
  const last = [...cartStore.cart.value].reverse().find((inst) => inst.ticket_id === ticketId)
  if (last) void requestRemove(last.uid)
}

// Resolves the ticket then delegates to the shared identityKey helper.
function identityKeyFor(ticketId: number): string | null {
  const t = event.tickets.find((x) => x.id === ticketId)
  return identityKey(t?.participant_fields ?? [])
}

// Start over = discard this whole checkout (saved progress, entered details, and the ticket
// selection) and go back to the event page to choose tickets again — a clean, full reset.
async function startOver(): Promise<void> {
  const hasEnteredData =
    cartStore.cart.value.some((inst) => hasData(cartStore.cart.value, inst.uid)) || c.buyer.email !== ''
  if (hasEnteredData) {
    const ok = await confirm({
      title: 'Start over?',
      message: 'This clears your tickets and everything you have entered, and takes you back to choose tickets.',
      confirmLabel: 'Start over',
    })
    if (!ok) return
  }
  persistence.clear()
  await navigateTo(`/e/${slug.value}`)
}
</script>

<template>
  <div class="mx-auto w-full max-w-3xl">
    <!-- ENTRY — always renders the ticket picker (every ticket), even with an empty cart.
         ?tickets= only pre-fills the quantities; selection happens right here. -->
    <article v-if="view === 'entry'" class="space-y-8 px-4 pb-32 pt-8">
      <header>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout — {{ event.title }}</h1>
        <p class="mt-2 text-base text-gray-500 dark:text-gray-400">
          Choose your tickets and any optional extras below.
          <span v-if="cartStore.cart.value.length > 0">
            Fields marked
            <span class="font-semibold text-danger-500">*</span>
            need an answer.
          </span>
        </p>
      </header>

      <div id="checkout-tickets">
        <CheckoutTickets
          :event="event"
          :quantity-of="cartStore.quantityOf"
          :max-for="cartStore.maxFor"
          :on-add="cartStore.addTicket"
          :on-remove-one="onRemoveOne"
        />
      </div>

      <!-- Self-hides when no purchased ticket collects attendee details. -->
      <div id="checkout-attendees">
        <CheckoutAttendees
          :event="event"
          :cart="cartStore.cart.value"
          :identity-key-for="identityKeyFor"
          :errors="c.fieldErrors.value"
          @remove="requestRemove"
          @add-participant="cartStore.addParticipant"
          @remove-participant="(uid, i) => cartStore.removeParticipant(uid, i)"
        />
      </div>

      <!-- Always available: the buyer can check out with just an optional extra (e.g. a donation). -->
      <div id="checkout-addons">
        <CheckoutAddOns
          v-if="event.form_fields && event.form_fields.length > 0"
          :fields="event.form_fields"
          :answers="c.checkoutAnswers"
          :errors="c.fieldErrors.value"
        />
      </div>

      <div v-if="hasContent" class="pt-2">
        <button
          type="button"
          class="text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="startOver"
        >
          Start over
        </button>
      </div>
    </article>

    <!-- REVIEW -->
    <article v-else class="px-4 pb-32 pt-8">
      <CheckoutReview
        :groups="reviewGroups"
        :calculation="c.calculation.value"
        :status="c.totalsStatus.value"
        :buyer="c.buyer"
        :email-error="c.fieldErrors.value['buyer.email']"
        @edit="leaveReview"
      />
    </article>

    <!-- Submit error — shown near the pay bar when placeAndPay fails with a non-422 error -->
    <div v-if="submitError" role="alert" class="fixed inset-x-0 bottom-20 z-20 flex justify-center px-4">
      <p
        class="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700 shadow dark:bg-danger-900/40 dark:text-danger-300"
      >
        {{ submitError }}
      </p>
    </div>

    <CheckoutPayBar
      :calculation="c.calculation.value"
      :status="c.totalsStatus.value"
      :mode="view"
      :continue-disabled="!hasContent"
      :submitting="submitting"
      @retry="c.recalcTotals"
      @continue="goToReview"
      @back="leaveReview(null)"
      @pay="placeAndPay"
    />

    <!-- Redirecting interstitial — covers the viewport while placeAndPay is in-flight -->
    <div
      v-if="submitting"
      data-test="payment-interstitial"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60"
      aria-live="assertive"
      aria-atomic="true"
      role="status"
    >
      <div class="flex flex-col items-center gap-5 rounded-2xl bg-white px-10 py-8 shadow-xl dark:bg-gray-800">
        <!-- Spinner: animated for users who allow motion, static for those who prefer reduced motion -->
        <span
          class="block h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-500 motion-safe:animate-spin"
          aria-hidden="true"
        />
        <p class="text-center text-base font-semibold text-gray-900 dark:text-white">
          Redirecting you to our secure payment provider…
        </p>
        <span class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Lock :size="15" aria-hidden="true" />
          Secure checkout
        </span>
      </div>
    </div>
  </div>
</template>
