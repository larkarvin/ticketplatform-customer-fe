<!-- controls/ProductField.vue -->
<!-- Renders a product field from the catalog data embedded in field.settings.product. The submit value
     is an array of { variant_id, quantity } selections (total quantity ≤ max_quantity). Pricing is shown
     for context; the order/payment flow itself is a later cycle. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Field, ProductFieldInfo, ProductSelection, ProductVariant } from '~/features/forms/types'
import { borderClass } from './inputClass'

const props = defineProps<{ field: Field; modelValue: unknown; invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [ProductSelection[]] }>()

const product = computed<ProductFieldInfo | null>(() => {
  const p = props.field.settings.product
  return p && typeof p === 'object' ? (p as ProductFieldInfo) : null
})
const maxQuantity = computed(() =>
  typeof props.field.settings.max_quantity === 'number' ? props.field.settings.max_quantity : 1
)
const variants = computed<ProductVariant[]>(() => (product.value?.variants ?? []).filter((v) => v.is_active))

const selections = computed<ProductSelection[]>(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
const qtyFor = (variantId: number) => selections.value.find((s) => s.variant_id === variantId)?.quantity ?? 0

function priceLabel(v: ProductVariant): string {
  const p = v.prices[0]
  return p ? `${p.currency} ${p.price}` : ''
}

function setQty(variantId: number, raw: number): void {
  const qty = Math.max(0, Math.min(Number.isFinite(raw) ? raw : 0, maxQuantity.value))
  const next = selections.value.filter((s) => s.variant_id !== variantId)
  if (qty > 0) next.push({ variant_id: variantId, quantity: qty })
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="rounded-lg border p-3 dark:bg-gray-900" :class="borderClass(props.invalid ?? false)">
    <p v-if="product" class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">{{ product.name }}</p>
    <p v-if="!variants.length" class="text-sm text-gray-500 dark:text-gray-400">No options available.</p>
    <div v-for="v in variants" :key="v.id" class="flex items-center justify-between gap-3 py-1">
      <span class="text-sm text-gray-700 dark:text-gray-300">
        {{ v.name }}
        <span v-if="priceLabel(v)" class="text-gray-500 dark:text-gray-400">· {{ priceLabel(v) }}</span>
      </span>
      <input
        :id="`field-${props.field.id}`"
        type="number"
        min="0"
        :max="maxQuantity"
        :value="qtyFor(v.id)"
        :aria-label="`Quantity for ${v.name}`"
        class="min-h-tap w-20 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-base text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
        @input="setQty(v.id, Number(($event.target as HTMLInputElement).value))"
      />
    </div>
    <p v-if="maxQuantity > 1" class="mt-2 text-xs text-gray-400">Up to {{ maxQuantity }} in total.</p>
  </div>
</template>
