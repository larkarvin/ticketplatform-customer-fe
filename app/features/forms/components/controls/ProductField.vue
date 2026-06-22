<!-- controls/ProductField.vue -->
<!-- Renders a product field from the catalog data embedded in field.settings.product: product image,
     and a row per variant (thumbnail, attributes, price, quantity). The submit value is an array of
     { variant_id, quantity } (total ≤ max_quantity). Pricing/order flow is a later cycle. -->
<script setup lang="ts">
import { borderClass } from '#core/field-engine/components/controls/inputClass'
import type { Field } from '#core/field-engine/types'
import { Minus, Plus } from '#icons'
import { computed } from 'vue'
import type { ProductFieldInfo, ProductImageMedia, ProductSelection, ProductVariant } from '~/features/forms/types'

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
// max_quantity is a TOTAL across variants — cap on the running total, not per variant.
const totalQty = computed(() => selections.value.reduce((n, s) => n + s.quantity, 0))

// Variant image, falling back to the product image when the variant has none.
const variantImage = (v: ProductVariant) => v.image ?? product.value?.image ?? null
const thumb = (img: ProductImageMedia | null) => (img ? (img.thumb_url ?? img.url) : null)

function attrLabel(v: ProductVariant): string {
  return v.attribute_values.map((a) => (a.attribute ? `${a.attribute}: ${a.value}` : a.value)).join(' · ')
}
function priceLabel(v: ProductVariant): string {
  const p = v.prices[0]
  return p ? `${p.currency} ${p.price}` : ''
}

function setQty(variantId: number, raw: number): void {
  // Clamp by the allowance left for the whole field (total of the other variants).
  const ceiling = Math.max(0, maxQuantity.value - (totalQty.value - qtyFor(variantId)))
  const qty = Math.max(0, Math.min(Number.isFinite(raw) ? raw : 0, ceiling))
  const next = selections.value.filter((s) => s.variant_id !== variantId)
  if (qty > 0) next.push({ variant_id: variantId, quantity: qty })
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="rounded-lg border p-3 dark:bg-gray-900" :class="borderClass(props.invalid ?? false)">
    <!-- Product header -->
    <div v-if="product" class="mb-3 flex items-center gap-3">
      <img
        v-if="thumb(product.image)"
        :src="thumb(product.image) ?? undefined"
        :alt="product.image?.alt_text ?? product.name"
        class="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
      <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ product.name }}</p>
    </div>

    <p v-if="!variants.length" class="text-sm text-gray-500 dark:text-gray-400">No options available.</p>

    <div
      v-for="(v, i) in variants"
      :key="v.id"
      class="flex items-center gap-3 border-t border-gray-100 py-2 first:border-t-0 dark:border-gray-800"
    >
      <img
        v-if="thumb(variantImage(v))"
        :src="thumb(variantImage(v)) ?? undefined"
        :alt="variantImage(v)?.alt_text ?? v.name"
        class="h-12 w-12 shrink-0 rounded-md object-cover"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm text-gray-700 dark:text-gray-300">{{ v.name }}</p>
        <p v-if="attrLabel(v)" class="truncate text-xs text-gray-500 dark:text-gray-400">{{ attrLabel(v) }}</p>
        <p v-if="priceLabel(v)" class="text-xs text-gray-500 dark:text-gray-400">{{ priceLabel(v) }}</p>
      </div>
      <!-- Tap-friendly quantity stepper (mobile-first): 44px +/- buttons around the value. The input
           stays (keyboard + the cell label target) but is read-only so touch goes through the buttons. -->
      <div class="inline-flex shrink-0 items-center rounded-lg border border-gray-300 dark:border-gray-700">
        <button
          type="button"
          class="flex min-h-tap min-w-tap items-center justify-center text-gray-600 disabled:opacity-40 dark:text-gray-300"
          :disabled="qtyFor(v.id) <= 0"
          :aria-label="`Decrease quantity for ${v.name}`"
          @click="setQty(v.id, qtyFor(v.id) - 1)"
        >
          <Minus :size="18" />
        </button>
        <input
          :id="i === 0 ? `field-${props.field.id}` : `field-${props.field.id}-${v.id}`"
          type="text"
          inputmode="numeric"
          readonly
          :value="qtyFor(v.id)"
          :aria-label="`Quantity for ${v.name}`"
          class="w-8 border-0 bg-transparent p-0 text-center text-base text-gray-900 focus:outline-hidden dark:text-white/90"
        />
        <button
          type="button"
          class="flex min-h-tap min-w-tap items-center justify-center text-gray-600 disabled:opacity-40 dark:text-gray-300"
          :disabled="totalQty >= maxQuantity"
          :aria-label="`Increase quantity for ${v.name}`"
          @click="setQty(v.id, qtyFor(v.id) + 1)"
        >
          <Plus :size="18" />
        </button>
      </div>
    </div>
    <p v-if="maxQuantity > 1" class="mt-2 text-xs text-gray-400">Up to {{ maxQuantity }} in total.</p>
  </div>
</template>
