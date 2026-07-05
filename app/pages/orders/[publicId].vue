<!-- Order / thank-you page. Loaded after checkout (free order) or after returning from a payment gateway. -->
<script setup lang="ts">
import { AlertCircle, CheckCircle, Clock, Loader2, Timer } from '#icons'
import { computed, ref } from 'vue'
import OrderAttendeePanel from '~/features/events/components/order/OrderAttendeePanel.vue'
import { useOrderManage } from '~/features/events/composables/useOrderManage'
import { useOrderStatus } from '~/features/events/composables/useOrderStatus'
import { formatMoney } from '~/features/events/money'
import { buildTicketsQuery, formatCountdown, seedStatus } from '~/features/events/orderPage'
import { ordersService } from '~/features/events/services/orders.service'
import type { PublicOrder } from '~/features/events/types'

const route = useRoute()
// The route param is the order's public_id (a random UUID) — the sole handle used to
// address the order via URL/fetch/poll/resume. order_number is a display-only reference,
// read from the fetched order below (see the "Order reference" markup).
const publicId = computed(() => String(route.params.publicId))
useSeoMeta({ title: () => (order.value?.order_number ? `Order ${order.value.order_number}` : 'Order status') })

// Fetch order synchronously (SSR-safe) before any await in this script block.
const { data } = await useAsyncData(`order:${publicId.value}`, () => ordersService.getOrder(publicId.value))

const order = ref<PublicOrder | null>(data.value ?? null)

// Seed `processing` (not "reserved / Resume payment") when returning from a successful
// gateway redirect on a not-yet-paid order, so the buyer is never invited to pay twice.
const returnStatus = Array.isArray(route.query.status) ? route.query.status[0] : route.query.status

// Replace ad-hoc poll loop with the composable (SSR-safe timers, terminal-state guards).
const { state, secondsLeft, refresh, stop } = useOrderStatus(publicId.value, {
  status: seedStatus(order.value?.payment_status ?? 'pending', returnStatus ?? undefined),
  expires_at: order.value?.expires_at ?? null,
})

// Nothing to poll when the order never loaded — the page shows the retry error instead.
if (!order.value) stop()

// Resume / Try-again — guarded against double-click.
const resuming = ref(false)

async function handleResume(): Promise<void> {
  if (resuming.value) return
  resuming.value = true
  try {
    // Build the absolute return URL in the click handler so it is SSR-safe (no window at module scope).
    const returnUrl = `${window.location.origin}/orders/${publicId.value}`
    const result = await ordersService.initiatePayment(publicId.value, returnUrl)
    if (result.redirect_url) {
      window.location.assign(result.redirect_url)
    } else {
      await refresh()
    }
  } finally {
    resuming.value = false
  }
}

// Rebuild my order — re-seeds the event checkout from the order's ticket lines via the
// authoritative `?tickets=` URL channel (the checkout page parses it and seeds the cart,
// including per-instance min_participants). Falls back to / when the order has no event
// slug or no ticket lines (non-ticket orders).
function handleRebuild(): void {
  const currentOrder = order.value
  if (!currentOrder) {
    void navigateTo('/')
    return
  }
  const query = buildTicketsQuery(currentOrder)
  if (query === null || currentOrder.event_slug === null) {
    void navigateTo('/')
    return
  }
  void navigateTo(`/e/${currentOrder.event_slug}/checkout?tickets=${query}`)
}

const countdownDisplay = computed(() => formatCountdown(secondsLeft.value))

// Link back to the order's source event/form public page. `type` picks the route prefix (/e vs /f).
const sourceLink = computed(() => {
  const o = order.value
  if (!o?.source_slug || !o.source_name) return null
  return { name: o.source_name, to: `${o.type === 'form' ? '/f/' : '/e/'}${o.source_slug}` }
})

// Absolute clock time the hold expires (e.g. "14:59"), shown alongside the countdown. Rendered
// client-only (inside the countdown's ClientOnly) so the local-timezone formatting never differs
// between the server and the browser.
const expiryClock = computed(() => {
  const iso = order.value?.expires_at
  if (!iso) return ''
  // 24-hour, browser timezone (toLocaleTimeString defaults to the local zone), with the zone shown.
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  })
})

// When the order was paid, formatted in the buyer's locale/timezone. Rendered client-only (see the
// paid state) so the timezone formatting never mismatches between server and browser.
const paidOn = computed(() => {
  const iso = order.value?.paid_at
  if (!iso) return ''
  // 24-hour clock, browser timezone (toLocaleString defaults to the local zone), with the zone shown.
  return new Date(iso).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  })
})

// Full reload re-runs the SSR fetch from scratch — the simplest correct recovery from a failed load.
function reloadPage(): void {
  if (typeof window !== 'undefined') window.location.reload()
}

// Customer self-service: resend the paid receipt to the buyer's own email via the public magic link.
// Deliberately independent of useOrderManage (order-management / resend-link) — no staff involvement.
const resendingReceipt = ref(false)
const receiptMessage = ref<string | null>(null)
const receiptError = ref<string | null>(null)
async function resendReceipt(): Promise<void> {
  if (resendingReceipt.value) return
  resendingReceipt.value = true
  receiptMessage.value = null
  receiptError.value = null
  try {
    const { message } = await ordersService.resendReceipt(publicId.value)
    receiptMessage.value = message
  } catch {
    receiptError.value = "We couldn't resend the receipt just now — please try again."
  } finally {
    resendingReceipt.value = false
  }
}

const manage = useOrderManage(order)

async function onCancel(): Promise<void> {
  if (!window.confirm('This releases your tickets — you’ll need to start over to get them back. Cancel?')) return
  await manage.cancel()
  // Reflect the cancellation immediately instead of waiting for the next status poll.
  await refresh()
}
</script>

<template>
  <article class="mx-auto w-full max-w-2xl px-4 py-10">
    <!-- Status section — aria-live so screen readers announce state transitions. Only shown once the
         order actually loaded: if the fetch failed (network / rate limit / 5xx) we must NOT fall back
         to the payable "reserved" state, which would invite a second payment on an already-paid order. -->
    <section v-if="order" aria-live="polite">
      <!-- processing -->
      <template v-if="state === 'processing'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <Loader2 :size="28" :stroke-width="2" class="motion-safe:animate-spin text-brand-600" aria-hidden="true" />
          Confirming your payment…
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">
          This usually takes just a moment. Please don't close this page.
        </p>
      </template>

      <!-- paid -->
      <template v-else-if="state === 'paid'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <CheckCircle :size="28" :stroke-width="2" class="text-success-600" aria-hidden="true" />
          You're in!
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">A receipt has been emailed to you.</p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <ClientOnly>
            <template v-if="paidOn">Paid {{ paidOn }} ·</template>
          </ClientOnly>
          Order
          <span class="font-mono">#{{ order.order_number }}</span>
        </p>
        <p v-if="order.payment_reference" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Payment ref
          <span class="font-mono">{{ order.payment_reference }}</span>
        </p>
        <div class="mt-6">
          <button
            type="button"
            class="min-h-tap block text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            :disabled="resendingReceipt"
            @click="resendReceipt"
          >
            {{ resendingReceipt ? 'Sending…' : 'Resend receipt' }}
          </button>
          <p v-if="receiptMessage" class="mt-2 text-sm text-success-700">
            {{ receiptMessage }}
          </p>
          <p v-if="receiptError" role="alert" class="mt-2 text-sm text-danger-600">
            {{ receiptError }}
          </p>
        </div>
      </template>

      <!-- awaiting -->
      <template v-else-if="state === 'awaiting'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <Timer :size="28" :stroke-width="2" class="text-warning-600" aria-hidden="true" />
          Your order is reserved
        </h1>
        <!-- The countdown is time-relative (Date.now), so it must not be server-rendered: SSR and the
             client would differ by ~1s → a hydration mismatch that crashes the client render (via
             unhead's unmount cleanup) and drops the buttons below. ClientOnly renders it fresh on the
             client; the server shows the static fallback. -->
        <ClientOnly>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            <template v-if="countdownDisplay">
              Held for
              <span class="font-mono">{{ countdownDisplay }}</span>
              <template v-if="expiryClock">
                until
                <span class="font-mono">{{ expiryClock }}</span>
              </template>
            </template>
            <template v-else>Complete payment to confirm your spot.</template>
          </p>
          <template #fallback>
            <p class="mt-2 text-gray-600 dark:text-gray-300">Complete payment to confirm your spot.</p>
          </template>
        </ClientOnly>
        <div class="mt-6">
          <button
            type="button"
            class="min-h-tap min-w-tap inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            :disabled="resuming"
            @click="handleResume"
          >
            {{ resuming ? 'Redirecting…' : 'Resume payment' }}
          </button>
          <button
            type="button"
            class="min-h-tap mt-3 block text-sm font-medium text-gray-500 underline hover:text-gray-700 dark:text-gray-400"
            :disabled="manage.cancelling.value"
            @click="onCancel"
          >
            Cancel this order
          </button>
          <button
            type="button"
            class="min-h-tap mt-3 block text-sm font-medium text-brand-600 hover:text-brand-700"
            :disabled="manage.resending.value"
            @click="manage.resend"
          >
            Email me this order link
          </button>
          <p v-if="manage.resendMessage.value" class="mt-2 text-sm text-success-700">
            {{ manage.resendMessage.value }}
          </p>
        </div>
      </template>

      <!-- failed -->
      <template v-else-if="state === 'failed'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <AlertCircle :size="28" :stroke-width="2" class="text-danger-600" aria-hidden="true" />
          That payment didn't go through
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">No charge was made. You can try again below.</p>
        <div class="mt-6">
          <button
            type="button"
            class="min-h-tap min-w-tap inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            :disabled="resuming"
            @click="handleResume"
          >
            {{ resuming ? 'Redirecting…' : 'Try again' }}
          </button>
          <button
            type="button"
            class="min-h-tap mt-3 block text-sm font-medium text-brand-600 hover:text-brand-700"
            :disabled="manage.resending.value"
            @click="manage.resend"
          >
            Email me this order link
          </button>
          <p v-if="manage.resendMessage.value" class="mt-2 text-sm text-success-700">
            {{ manage.resendMessage.value }}
          </p>
        </div>
      </template>

      <!-- expired -->
      <template v-else-if="state === 'expired'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <Clock :size="28" :stroke-width="2" class="text-gray-400" aria-hidden="true" />
          This reservation expired
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">
          Your spot was released. You're welcome to start a new order.
        </p>
        <div class="mt-6">
          <button
            type="button"
            class="min-h-tap min-w-tap inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            @click="handleRebuild"
          >
            Rebuild my order
          </button>
        </div>
      </template>

      <!-- cancelled -->
      <template v-else-if="state === 'cancelled'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <Clock :size="28" :stroke-width="2" class="text-gray-400" aria-hidden="true" />
          This order was cancelled
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">
          Your tickets were released. You can start a new order any time.
        </p>
        <div class="mt-6">
          <button
            type="button"
            class="min-h-tap min-w-tap inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            @click="handleRebuild"
          >
            Rebuild my order
          </button>
        </div>
      </template>
    </section>

    <!-- Fetch failed — show an explicit error + retry instead of a misleading payable state. -->
    <section v-else aria-live="polite">
      <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
        <AlertCircle :size="28" :stroke-width="2" class="text-danger-600" aria-hidden="true" />
        We couldn't load your order
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Check your connection and try again — your order and any payment are safe.
      </p>
      <div class="mt-6">
        <button
          type="button"
          class="min-h-tap min-w-tap inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700"
          @click="reloadPage"
        >
          Try again
        </button>
      </div>
    </section>

    <!-- Link back to the source event/form public page -->
    <p v-if="order && sourceLink" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      For
      <NuxtLink :to="sourceLink.to" class="font-medium text-brand-600 hover:text-brand-700 hover:underline">
        {{ sourceLink.name }}
      </NuxtLink>
    </p>

    <!-- Order reference — display-only human reference (order_number), never the route's public_id.
         Hidden in the paid state, which shows the reference alongside the paid date instead. -->
    <p v-if="order && state !== 'paid'" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      Order
      <span class="font-mono">#{{ order.order_number }}</span>
    </p>

    <!-- Order items (shown for all states) -->
    <ul v-if="order" class="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="(item, i) in order.items"
        :key="i"
        class="flex justify-between py-3 text-sm text-gray-700 dark:text-gray-300"
      >
        <span>{{ item.unit_name }} × {{ item.quantity }}</span>
        <span>{{ formatMoney(Number(item.subtotal), order.currency) }}</span>
      </li>
    </ul>

    <!-- Subtotal + fee breakdown (shown only when there are fees; otherwise the Total alone is clear) -->
    <dl v-if="order && order.fees.length > 0" class="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
      <div class="flex justify-between">
        <dt>Subtotal</dt>
        <dd>{{ formatMoney(Number(order.subtotal), order.currency) }}</dd>
      </div>
      <div v-for="(fee, i) in order.fees" :key="i" class="flex justify-between">
        <dt>{{ fee.label }}</dt>
        <dd>{{ formatMoney(Number(fee.amount), order.currency) }}</dd>
      </div>
    </dl>

    <p v-if="order" class="mt-4 text-right text-lg font-semibold text-gray-900 dark:text-white">
      Total: {{ formatMoney(Number(order.total), order.currency) }}
    </p>

    <OrderAttendeePanel
      v-if="order && order.can_add_attendees"
      :order="order"
      :errors="manage.attendeeErrors.value"
      :saving="manage.savingAttendees.value"
      @submit="manage.submitAttendees"
    />
  </article>
</template>
