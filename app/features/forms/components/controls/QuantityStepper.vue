<!-- controls/QuantityStepper.vue -->
<!-- Tap-friendly quantity stepper (mobile-first): 44px +/- buttons around the value. The input stays
     (keyboard + the field label target) but is read-only so touch goes through the buttons. Used by
     ProductField for both the simple-product row and each variant row. -->
<script setup lang="ts">
import { useT } from '#core/i18n'
import { Minus, Plus } from '#icons'

const { t } = useT()

defineProps<{
  value: number
  inputId: string
  label: string
  canDecrement: boolean
  canIncrement: boolean
}>()
defineEmits<{ decrement: []; increment: [] }>()
</script>

<template>
  <div class="inline-flex shrink-0 items-center rounded-lg border border-gray-300 dark:border-gray-700">
    <button
      type="button"
      class="flex min-h-tap min-w-tap items-center justify-center text-gray-600 disabled:opacity-40 dark:text-gray-300"
      :disabled="!canDecrement"
      :aria-label="t('forms.quantity.decreaseAria', { label })"
      @click="$emit('decrement')"
    >
      <Minus :size="18" />
    </button>
    <input
      :id="inputId"
      type="text"
      inputmode="numeric"
      readonly
      :value="value"
      :aria-label="t('forms.quantity.valueAria', { label })"
      class="w-8 border-0 bg-transparent p-0 text-center text-base text-gray-900 focus:outline-hidden dark:text-white/90"
    />
    <button
      type="button"
      class="flex min-h-tap min-w-tap items-center justify-center text-gray-600 disabled:opacity-40 dark:text-gray-300"
      :disabled="!canIncrement"
      :aria-label="t('forms.quantity.increaseAria', { label })"
      @click="$emit('increment')"
    >
      <Plus :size="18" />
    </button>
  </div>
</template>
