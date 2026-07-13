<!-- app/features/events/components/checkout/CheckoutReview.vue -->
<!-- Review step: read-back (with Edit) + order breakdown + receipt email + reserved terms slot.
     Props in / events out; the buyer object is the reactive one owned by usePublicCheckout. -->
<script setup lang="ts">
import { borderClass, controlClass } from '#core/field-engine/components/controls/inputClass'
import { useT } from '#core/i18n'
import { Mail } from '#icons'
import { nextTick, ref, watch } from 'vue'
import ReviewSummary from '~/core/components/ReviewSummary.vue'
import type { ReviewGroup } from '~/core/types/review'
import { EDIT_TICKETS } from '../../checkoutReview'
import type { OrderCalculation } from '../../types'
import OrderBreakdown from './OrderBreakdown.vue'

const { t } = useT()

const props = defineProps<{
  groups: ReviewGroup[]
  calculation: OrderCalculation | null
  status: 'idle' | 'updating' | 'error'
  buyer: { email: string }
  emailError?: string
}>()
const emit = defineEmits<{ edit: [editTarget: number] }>()

// Confirmed-text + Change pattern (mirrors the form's Review email): show the input on first entry,
// collapse to confirmed text once a value exists, reveal again on Change.
const editingEmail = ref(props.buyer.email === '')
// When an email error is present, always force the input open so the user can correct it.
watch(
  () => props.emailError,
  (err) => {
    if (err) editingEmail.value = true
  },
  { immediate: true }
)
const emailInput = ref<HTMLInputElement | null>(null)
function changeEmail(): void {
  editingEmail.value = true
  void nextTick(() => emailInput.value?.focus())
}
function setEmail(value: string): void {
  // eslint-disable-next-line vue/no-mutating-props -- buyer is the reactive object owned by usePublicCheckout; mutation is by design.
  props.buyer.email = value
}
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('checkout.review.heading') }}</h1>

    <ReviewSummary :groups="groups" @edit="emit('edit', $event)" />

    <OrderBreakdown :calculation="calculation" :status="status" editable @edit="emit('edit', EDIT_TICKETS)" />

    <section class="space-y-2">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ t('checkout.review.emailLabel') }}
        <span class="text-danger-500">*</span>
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('checkout.review.emailHint') }}</p>

      <div
        v-if="buyer.email && !editingEmail"
        class="flex min-h-control-lg items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 dark:border-gray-700"
      >
        <span class="inline-flex min-w-0 items-center gap-2 text-base text-gray-900 dark:text-white">
          <Mail :size="18" class="shrink-0 text-gray-400" />
          <span class="truncate">{{ buyer.email }}</span>
        </span>
        <button
          type="button"
          data-test="change-email"
          class="min-h-tap shrink-0 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-300"
          @click="changeEmail"
        >
          {{ t('common.change') }}
        </button>
      </div>
      <div v-else class="relative">
        <input
          ref="emailInput"
          :value="buyer.email"
          type="email"
          autocomplete="email"
          :placeholder="t('checkout.review.emailPlaceholder')"
          :aria-invalid="emailError ? 'true' : 'false'"
          :class="[controlClass, borderClass(!!emailError), 'pl-14']"
          @input="setEmail(($event.target as HTMLInputElement).value)"
          @blur="editingEmail = buyer.email === '' || !!emailError"
        />
        <span
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-gray-300 px-4 text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          <Mail :size="20" />
        </span>
      </div>
      <p v-if="emailError" role="alert" class="mt-1 text-sm text-danger-600 dark:text-danger-400">
        {{ emailError }}
      </p>
    </section>

    <!-- Reserved: terms acceptance — wired in a later cross-repo PR alongside payment. -->
  </div>
</template>
