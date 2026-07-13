<!-- Sticky bottom bar. Entry mode: running total + Continue to review. Review mode: total + Back + Pay. -->
<script setup lang="ts">
import { useT } from '#core/i18n'
import { ChevronLeft, ChevronRight } from '#icons'
import { computed } from 'vue'
import { formatMoney } from '../../money'
import type { OrderCalculation } from '../../types'

const { t } = useT()

const props = defineProps<{
  calculation: OrderCalculation | null
  status: 'idle' | 'updating' | 'error'
  mode: 'entry' | 'review'
  /** Disable the entry "Continue to review" action (e.g. no tickets chosen yet). */
  continueDisabled?: boolean
  /** True while the pay action is in-flight (redirecting to payment provider). */
  submitting?: boolean
}>()

const emit = defineEmits<{ retry: []; continue: []; back: []; pay: [] }>()

const totalText = computed(() =>
  props.calculation ? formatMoney(props.calculation.total, props.calculation.currency) : '—'
)
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
      <div class="min-w-0">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.total') }}</p>
        <p
          v-if="status === 'updating'"
          class="text-sm text-gray-400 dark:text-gray-500"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ t('common.updating') }}
        </p>
        <p v-else class="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{{ totalText }}</p>
      </div>

      <div class="flex flex-shrink-0 items-center gap-3">
        <span v-if="status === 'error'" class="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400">
          {{ t('checkout.payBar.updateFailed') }}
          <button
            type="button"
            data-retry
            class="font-medium text-brand-500 underline hover:text-brand-600"
            @click="emit('retry')"
          >
            {{ t('common.retry') }}
          </button>
        </span>

        <button
          v-if="mode === 'entry'"
          type="button"
          data-test="continue"
          :disabled="continueDisabled"
          class="inline-flex min-h-tap items-center gap-1.5 rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-500"
          :class="continueDisabled ? '' : 'cursor-pointer'"
          @click="emit('continue')"
        >
          {{ t('checkout.payBar.continueToReview') }}
          <ChevronRight :size="20" />
        </button>

        <template v-else>
          <button
            type="button"
            data-test="back"
            class="inline-flex min-h-tap cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 px-5 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            @click="emit('back')"
          >
            <ChevronLeft :size="20" />
            {{ t('common.back') }}
          </button>
          <button
            type="button"
            data-test="pay"
            :disabled="props.submitting || status === 'updating' || status === 'error' || !calculation"
            class="inline-flex min-h-tap items-center gap-2 rounded-xl bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            :class="props.submitting || status === 'updating' ? '' : 'cursor-pointer'"
            @click="emit('pay')"
          >
            <span v-if="props.submitting" aria-live="polite">{{ t('checkout.payBar.redirecting') }}</span>
            <span v-else>{{ calculation ? t('checkout.payBar.pay', { total: totalText }) : t('common.pay') }}</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
