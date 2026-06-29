<!-- Order / thank-you page. Loaded after checkout (free order) or after returning from a payment gateway. -->
<script setup lang="ts">
import { CheckCircle } from '#icons'
import { computed, onMounted, ref } from 'vue'
import { ordersService } from '~/features/events/services/orders.service'
import type { PublicOrder } from '~/features/events/types'

const route = useRoute()
const orderNumber = computed(() => String(route.params.orderNumber))
useSeoMeta({ title: () => `Order ${orderNumber.value}` })

// Fetch order synchronously (SSR-safe) before any await in this script block.
const { data } = await useAsyncData(`order:${orderNumber.value}`, () => ordersService.getOrder(orderNumber.value))

const order = ref<PublicOrder | null>(data.value ?? null)
// Seed status from the full order object; the poll will overwrite it on the client.
const status = ref<string>(data.value?.payment_status ?? '')

// Poll the lightweight payment-status endpoint on the client.
// The buyer returns here from the gateway after paying; we update UI as soon as the status resolves.
onMounted(async () => {
  for (let i = 0; i < 10 && status.value !== 'paid' && status.value !== 'failed'; i++) {
    const s = await ordersService.paymentStatus(orderNumber.value)
    status.value = s.status
    if (s.status === 'paid' || s.status === 'failed') break
    await new Promise<void>((resolve) => setTimeout(resolve, 2000))
  }
})

const paid = computed(() => status.value === 'paid')
</script>

<template>
  <article class="mx-auto w-full max-w-2xl px-4 py-10">
    <h1 class="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
      <CheckCircle v-if="paid" :size="28" :stroke-width="2" class="text-success-600" aria-hidden="true" />
      {{ paid ? "You're all set" : 'Order received' }}
    </h1>

    <p class="mt-2 text-gray-600 dark:text-gray-300">
      Order
      <span class="font-mono">{{ orderNumber }}</span>
      —
      <span :class="paid ? 'text-success-600' : 'text-warning-600'">{{ paid ? 'Paid' : 'Awaiting payment' }}</span>
    </p>

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
