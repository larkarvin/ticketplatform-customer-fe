<!-- customer-fe/app/features/recovery/components/RecoveryItemCard.vue -->
<!--
  One recovered row — an order or a standalone form submission — plus the single action that gets the
  guest back to it. Props in, no events: the API hands us a `url` that already authorizes itself (a
  signed pay link, or the submission's edit slug), so the card is a plain <a href> to an absolute URL,
  not a NuxtLink route.
-->
<script setup lang="ts">
import { useT } from '#core/i18n'
import { FileText, Ticket } from '#icons'
import { computed } from 'vue'
import type { RecoveryItem } from '../types'

const props = defineProps<{ item: RecoveryItem }>()

const { t } = useT()

// The API's whole status vocabulary: PaymentStatus for orders, plus the fixed 'submitted' for
// standalone submissions. A status added later simply shows no badge — better than showing a
// 70-year-old a raw machine word we have no plain-English wording for.
const STATUS_TONES: Record<string, string> = {
  pending: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  paid: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  failed: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const isOrder = computed(() => props.item.type === 'order')

const statusTone = computed(() => STATUS_TONES[props.item.status] ?? '')
const statusLabel = computed(() => (statusTone.value ? t(`recovery.status.${props.item.status}`) : ''))

// An unpaid (or failed) order is the main reason a guest comes back at all, so the button names the
// thing that is still outstanding rather than a vague "view".
const needsPayment = computed(
  () => isOrder.value && (props.item.status === 'pending' || props.item.status === 'failed')
)

const actionLabel = computed(() => {
  if (!isOrder.value) return t('recovery.item.updateAnswers')
  return needsPayment.value ? t('recovery.item.finishPayment') : t('recovery.item.viewOrder')
})

// `created_at` is nullable on the wire (RecoveryItemResource). No date at all beats "Invalid Date".
const createdOn = computed(() => {
  const iso = props.item.created_at
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
})

const dateLine = computed(() => {
  if (!createdOn.value) return ''
  return t(isOrder.value ? 'recovery.item.orderedOn' : 'recovery.item.sentOn', { date: createdOn.value })
})
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div class="flex items-start gap-3">
      <component
        :is="isOrder ? Ticket : FileText"
        :size="24"
        class="mt-0.5 shrink-0 text-gray-400"
        aria-hidden="true"
      />

      <div class="min-w-0 flex-1">
        <h3 class="text-lg font-semibold break-words text-gray-900 dark:text-white">{{ item.title }}</h3>

        <p v-if="isOrder && item.reference" class="mt-1 text-base text-gray-600 dark:text-gray-300">
          {{ t('recovery.item.orderReference', { reference: item.reference }) }}
        </p>

        <!-- Local-timezone formatting differs between the server and the browser, which would be a
             hydration mismatch on the SSR'd magic-link page. Render it on the client only. -->
        <ClientOnly>
          <p v-if="dateLine" class="mt-1 text-base text-gray-500 dark:text-gray-400">{{ dateLine }}</p>
        </ClientOnly>

        <p v-if="statusLabel" class="mt-3">
          <span :class="['inline-block rounded-full px-3 py-1 text-base font-medium', statusTone]">
            {{ statusLabel }}
          </span>
        </p>
      </div>
    </div>

    <a
      :href="item.url"
      class="min-h-tap mt-4 flex w-full items-center justify-center rounded-lg bg-brand-500 px-6 text-base font-semibold text-white transition hover:bg-brand-600"
    >
      {{ actionLabel }}
    </a>
  </div>
</template>
