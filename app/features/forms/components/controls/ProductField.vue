<!-- controls/ProductField.vue -->
<!-- Renders a product field from the catalog data embedded in field.settings.product. A "simple"
     product (a single variant) collapses to one compact row — clickable image, product name, price,
     stepper — with no duplicated image or variant line. A product with multiple variants shows the
     product image + name once, then one clean line per variant (the variant in plain words, its price,
     a stepper) with a running "Total: x of max". In both cases the product image is clickable and opens
     a lightbox. The submit value is an array of
     { variant_id, quantity } (total ≤ max_quantity). Pricing/order flow is a later cycle. -->
<script setup lang="ts">
import ImageLightbox from '#core/components/ui/ImageLightbox.vue'
import { borderClass } from '#core/field-engine/components/controls/inputClass'
import type { Field } from '#core/field-engine/types'
import { computed, ref } from 'vue'
import type { ProductFieldInfo, ProductImageMedia, ProductSelection, ProductVariant } from '~/features/forms/types'
import QuantityStepper from './QuantityStepper.vue'

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
// A simple product is a single-variant product: the variant IS the product, so its image/name would
// only duplicate the header. Render it as one compact row instead.
const isSimple = computed(() => variants.value.length === 1)

const selections = computed<ProductSelection[]>(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
const qtyFor = (variantId: number) => selections.value.find((s) => s.variant_id === variantId)?.quantity ?? 0
// max_quantity is a TOTAL across variants — cap on the running total, not per variant.
const totalQty = computed(() => selections.value.reduce((n, s) => n + s.quantity, 0))

const thumb = (img: ProductImageMedia | null) => (img ? (img.thumb_url ?? img.url) : null)

// A variant in plain words for the listing: its attribute values joined ("Medium – Red"), falling
// back to the variant name when it has no attributes.
function rowLabel(v: ProductVariant): string {
  const values = v.attribute_values.map((a) => a.value).filter(Boolean)
  return values.length ? values.join(' – ') : v.name
}
function priceLabel(v: ProductVariant): string {
  const p = v.prices[0]
  return p ? `${p.currency} ${p.price}` : ''
}

// The id of the first variant's stepper input doubles as the field's label target.
const stepperId = (i: number, v: ProductVariant) =>
  i === 0 ? `field-${props.field.id}` : `field-${props.field.id}-${v.id}`

function setQty(variantId: number, raw: number): void {
  // Clamp by the allowance left for the whole field (total of the other variants).
  const ceiling = Math.max(0, maxQuantity.value - (totalQty.value - qtyFor(variantId)))
  const qty = Math.max(0, Math.min(Number.isFinite(raw) ? raw : 0, ceiling))
  const next = selections.value.filter((s) => s.variant_id !== variantId)
  if (qty > 0) next.push({ variant_id: variantId, quantity: qty })
  emit('update:modelValue', next)
}

// Clicking the product image opens a lightbox with the full-size image.
const lightboxOpen = ref(false)
const lightboxImages = computed(() =>
  product.value?.image
    ? [{ url: product.value.image.url, alt_text: product.value.image.alt_text ?? product.value.name }]
    : []
)
</script>

<template>
  <div class="rounded-lg border p-3 dark:bg-gray-900" :class="borderClass(props.invalid ?? false)">
    <!-- Simple product: one compact row — clickable image, name, price, stepper. -->
    <div v-if="isSimple && product" class="flex items-center gap-3">
      <button
        v-if="thumb(product.image)"
        type="button"
        class="shrink-0 overflow-hidden rounded-lg"
        :aria-label="`View image of ${product.name}`"
        @click="lightboxOpen = true"
      >
        <img
          :src="thumb(product.image) ?? undefined"
          :alt="product.image?.alt_text ?? product.name"
          width="64"
          height="64"
          loading="lazy"
          decoding="async"
          class="h-16 w-16 object-cover"
        />
      </button>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ product.name }}</p>
        <p v-if="priceLabel(variants[0]!)" class="text-sm text-gray-500 dark:text-gray-400">
          {{ priceLabel(variants[0]!) }}
        </p>
      </div>
      <QuantityStepper
        :input-id="stepperId(0, variants[0]!)"
        :label="product.name"
        :value="qtyFor(variants[0]!.id)"
        :can-decrement="qtyFor(variants[0]!.id) > 0"
        :can-increment="totalQty < maxQuantity"
        @decrement="setQty(variants[0]!.id, qtyFor(variants[0]!.id) - 1)"
        @increment="setQty(variants[0]!.id, qtyFor(variants[0]!.id) + 1)"
      />
    </div>

    <!-- Product with multiple variants: header + a row per variant. -->
    <template v-else>
      <div v-if="product" class="mb-3 flex items-center gap-3">
        <button
          v-if="thumb(product.image)"
          type="button"
          class="shrink-0 overflow-hidden rounded-lg"
          :aria-label="`View image of ${product.name}`"
          @click="lightboxOpen = true"
        >
          <img
            :src="thumb(product.image) ?? undefined"
            :alt="product.image?.alt_text ?? product.name"
            width="64"
            height="64"
            loading="lazy"
            decoding="async"
            class="h-16 w-16 object-cover"
          />
        </button>
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ product.name }}</p>
      </div>

      <p v-if="!variants.length" class="text-sm text-gray-500 dark:text-gray-400">No options available.</p>

      <div
        v-for="(v, i) in variants"
        :key="v.id"
        class="flex items-center gap-3 border-t border-gray-100 py-2 first:border-t-0 dark:border-gray-800"
      >
        <p class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{{ rowLabel(v) }}</p>
        <p v-if="priceLabel(v)" class="shrink-0 text-sm text-gray-500 dark:text-gray-400">{{ priceLabel(v) }}</p>
        <QuantityStepper
          :input-id="stepperId(i, v)"
          :label="rowLabel(v)"
          :value="qtyFor(v.id)"
          :can-decrement="qtyFor(v.id) > 0"
          :can-increment="totalQty < maxQuantity"
          @decrement="setQty(v.id, qtyFor(v.id) - 1)"
          @increment="setQty(v.id, qtyFor(v.id) + 1)"
        />
      </div>
    </template>

    <p v-if="maxQuantity > 1" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      Total: {{ totalQty }} of {{ maxQuantity }}
    </p>

    <ImageLightbox :is-open="lightboxOpen" :images="lightboxImages" @close="lightboxOpen = false" />
  </div>
</template>
