<!-- Order / thank-you page. Loaded after checkout (free order) or after returning from a payment gateway. -->
<script setup lang="ts">
import { AlertCircle, CheckCircle, Clock, Loader2, Timer } from '#icons'
import { computed, ref } from 'vue'
import { useCheckoutPersistence } from '~/features/events/composables/useCheckoutPersistence'
import { useOrderStatus } from '~/features/events/composables/useOrderStatus'
import { buildRebuildDraft, formatCountdown } from '~/features/events/orderPage'
import { ordersService } from '~/features/events/services/orders.service'
import type { PublicOrder } from '~/features/events/types'

const route = useRoute()
const orderNumber = computed(() => String(route.params.orderNumber))
useSeoMeta({ title: () => `Order ${orderNumber.value}` })

// Fetch order synchronously (SSR-safe) before any await in this script block.
const { data } = await useAsyncData(`order:${orderNumber.value}`, () => ordersService.getOrder(orderNumber.value))

const order = ref<PublicOrder | null>(data.value ?? null)

// Replace ad-hoc poll loop with the composable (SSR-safe timers, terminal-state guards).
const { state, secondsLeft, refresh } = useOrderStatus(orderNumber.value, {
  status: order.value?.payment_status ?? 'pending',
  expires_at: order.value?.expires_at ?? null,
})

// Resume / Try-again — guarded against double-click.
const resuming = ref(false)

async function handleResume(): Promise<void> {
  if (resuming.value) return
  resuming.value = true
  try {
    // Build the absolute return URL in the click handler so it is SSR-safe (no window at module scope).
    const returnUrl = `${window.location.origin}/orders/${orderNumber.value}`
    const result = await ordersService.initiatePayment(orderNumber.value, returnUrl)
    if (result.redirect_url) {
      window.location.assign(result.redirect_url)
    } else {
      await refresh()
    }
  } finally {
    resuming.value = false
  }
}

// Rebuild my order — re-seeds the checkout draft from the order's ticket lines and
// navigates to the event checkout. Falls back to / when the order has no event slug
// or no ticket lines (non-ticket orders).
function handleRebuild(): void {
  const currentOrder = order.value
  if (!currentOrder) {
    void navigateTo('/')
    return
  }
  const draft = buildRebuildDraft(currentOrder)
  if (draft === null || currentOrder.event_slug === null) {
    void navigateTo('/')
    return
  }
  const persistence = useCheckoutPersistence(currentOrder.event_slug)
  persistence.save(draft)
  void navigateTo(`/e/${currentOrder.event_slug}/checkout`)
}

const countdownDisplay = computed(() => formatCountdown(secondsLeft.value))
</script>

<template>
  <article class="mx-auto w-full max-w-2xl px-4 py-10">
    <!-- Status section — aria-live so screen readers announce state transitions -->
    <section aria-live="polite">
      <!-- processing -->
      <template v-if="state === 'processing'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <Loader2 :size="28" :stroke-width="2" class="motion-safe:animate-spin text-primary-600" aria-hidden="true" />
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
      </template>

      <!-- awaiting -->
      <template v-else-if="state === 'awaiting'">
        <h1 class="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
          <Timer :size="28" :stroke-width="2" class="text-warning-600" aria-hidden="true" />
          Your order is reserved
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">
          <template v-if="countdownDisplay">
            Held for
            <span class="font-mono">{{ countdownDisplay }}</span>
          </template>
          <template v-else>Complete payment to confirm your spot.</template>
        </p>
        <div class="mt-6">
          <button
            type="button"
            class="min-h-tap min-w-tap inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            :disabled="resuming"
            @click="handleResume"
          >
            {{ resuming ? 'Redirecting…' : 'Resume payment' }}
          </button>
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
            class="min-h-tap min-w-tap inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            :disabled="resuming"
            @click="handleResume"
          >
            {{ resuming ? 'Redirecting…' : 'Try again' }}
          </button>
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
    </section>

    <!-- Order reference -->
    <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      Order
      <span class="font-mono">{{ orderNumber }}</span>
    </p>

    <!-- Order items (shown for all states) -->
    <ul v-if="order" class="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="(item, i) in order.items"
        :key="i"
        class="flex justify-between py-3 text-sm text-gray-700 dark:text-gray-300"
      >
        <span>{{ item.name }} × {{ item.quantity }}</span>
        <span>{{ item.subtotal }}</span>
      </li>
    </ul>

    <p v-if="order" class="mt-4 text-right text-lg font-semibold text-gray-900 dark:text-white">
      Total: {{ order.currency }} {{ order.total }}
    </p>
  </article>
</template>
