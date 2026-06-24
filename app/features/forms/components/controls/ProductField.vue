<!-- controls/ProductField.vue -->
<!-- Renders a product field from the catalog data embedded in field.settings.product. A "simple"
     product (a single variant) collapses to one compact row — clickable image, product name, price,
     stepper — with no duplicated image or variant line. A product with multiple variants stays
     COLLAPSED by default: image + name + a "from" price + one button to reveal the options; once the
     options are open, each variant gets a plain-words row + price + stepper, with a running "Total: x
     of max". This keeps a six-variant product from dumping six steppers on a senior before they've said
     they even want it. The field auto-opens when it's invalid so a required, unanswered product can't
     hide its error. The submit value is an array of { variant_id, quantity } (total ≤ max_quantity). -->
<script setup lang="ts">
import ImageLightbox from '#core/components/ui/ImageLightbox.vue'
import { borderClass } from '#core/field-engine/components/controls/inputClass'
import type { Field } from '#core/field-engine/types'
import { ChevronDown } from '#icons'
import { computed, ref } from 'vue'
import { summariseSelections, variantLabel } from '~/features/forms/productLabels'
import type {
  ProductFieldInfo,
  ProductImageMedia,
  ProductSelection,
  ProductVariant,
  ProductVariantPrice,
} from '~/features/forms/types'
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

function priceLabel(v: ProductVariant): string {
  const p = v.prices[0]
  return p ? `${p.currency} ${p.price}` : ''
}

// ── Collapsed view helpers ──────────────────────────────────────────────────────────────────────
// Button label built from the real attribute names ("Choose Size & Colour"); generic fallback when a
// product has no named attributes.
const chooseLabel = computed(() => {
  const names = [
    ...new Set(
      variants.value.flatMap((v) => v.attribute_values.map((a) => a.attribute)).filter((a): a is string => !!a)
    ),
  ]
  return names.length ? `Choose ${names.join(' & ')}` : 'Choose options'
})
// A "from" teaser of the cheapest variant; a single figure when every variant costs the same.
const priceSummary = computed(() => {
  const prices = variants.value.map((v) => v.prices[0]).filter((p): p is ProductVariantPrice => !!p)
  const nums = prices.map((p) => Number(p.price)).filter((n) => Number.isFinite(n))
  if (!prices.length || !nums.length) return ''
  const min = Math.min(...nums)
  const currency = prices[0]!.currency
  return min === Math.max(...nums) ? `${currency} ${min.toFixed(2)}` : `From ${currency} ${min.toFixed(2)}`
})
// What the person has chosen, in plain words, for the collapsed summary.
const selectedRows = computed(() => summariseSelections(selections.value, variants.value))

// The id of the first variant's stepper input doubles as the field's label/error target — but only
// when the options are open. While collapsed the toggle button carries that id instead, so the label
// associates and a submit error focuses a control the person can actually see.
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

// Multi-variant products start collapsed; an invalid field forces itself open.
const expanded = ref(false)
const isExpanded = computed(() => expanded.value || !!props.invalid)
const optionsId = computed(() => `field-${props.field.id}-options`)
function toggle(): void {
  expanded.value = !expanded.value
}

// Clicking the product image opens a gallery: the product image first, then any variant that has its
// own image, each captioned with the variant in plain words. The lightbox navigates when there's more
// than one. Deduped by image id so a shared image only appears once.
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const galleryImages = computed<{ url: string; alt_text: string; caption?: string; thumb?: string }[]>(() => {
  const out: { url: string; alt_text: string; caption?: string; thumb?: string }[] = []
  const seen = new Set<number>()
  const add = (img: ProductImageMedia | null, caption?: string) => {
    if (!img || seen.has(img.id)) return
    seen.add(img.id)
    out.push({
      url: img.url,
      alt_text: img.alt_text ?? product.value?.name ?? 'Image',
      caption,
      thumb: img.thumb_url ?? img.url,
    })
  }
  add(product.value?.image ?? null)
  for (const v of variants.value) add(v.image, variantLabel(v))
  return out
})
function openGallery(): void {
  lightboxIndex.value = 0
  lightboxOpen.value = true
}
</script>

<template>
  <div class="rounded-lg border p-3" :class="borderClass(props.invalid ?? false)">
    <!-- Simple product: one compact row — clickable image, name, price, stepper. -->
    <div v-if="isSimple && product" class="flex items-center gap-3">
      <button
        v-if="thumb(product.image)"
        type="button"
        class="shrink-0 overflow-hidden rounded-lg"
        :aria-label="`View image of ${product.name}`"
        @click="openGallery()"
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
        <p class="text-base font-medium text-gray-800">{{ product.name }}</p>
        <p v-if="priceLabel(variants[0]!)" class="text-sm text-gray-500">{{ priceLabel(variants[0]!) }}</p>
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

    <!-- Product with multiple variants: header, then a collapsed summary or the open option list. -->
    <template v-else>
      <div class="flex items-center gap-3">
        <button
          v-if="product && thumb(product.image)"
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
        <p class="min-w-0 flex-1 text-base font-medium text-gray-800">{{ product?.name }}</p>
        <button
          v-if="isExpanded && variants.length"
          type="button"
          class="inline-flex min-h-tap shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          :aria-expanded="true"
          :aria-controls="optionsId"
          @click="toggle"
        >
          Done
          <ChevronDown :size="16" class="rotate-180" />
        </button>
      </div>

      <p v-if="!variants.length" class="mt-2 text-sm text-gray-500">No options available.</p>

      <!-- Collapsed: a price teaser or the current selection, plus the one button that opens the options. -->
      <div v-else-if="!isExpanded">
        <ul v-if="selectedRows.length" class="mt-2 space-y-0.5 text-sm text-gray-700">
          <li v-for="(row, i) in selectedRows" :key="i">{{ row }}</li>
        </ul>
        <p v-else-if="priceSummary" class="mt-1 text-sm text-gray-500">{{ priceSummary }}</p>
        <button
          :id="`field-${field.id}`"
          type="button"
          class="mt-3 inline-flex min-h-tap items-center gap-2 rounded-lg border border-gray-300 px-4 text-base font-medium text-gray-800 hover:bg-gray-50"
          :aria-expanded="false"
          :aria-controls="optionsId"
          @click="toggle"
        >
          {{ selectedRows.length ? 'Edit selection' : chooseLabel }}
          <ChevronDown :size="18" />
        </button>
      </div>

      <!-- Open: one row per variant. -->
      <div v-else :id="optionsId" class="mt-1">
        <div
          v-for="(v, i) in variants"
          :key="v.id"
          class="flex items-center gap-3 border-t border-gray-100 py-2 first:border-t-0"
        >
          <p class="min-w-0 flex-1 truncate text-sm text-gray-700">{{ variantLabel(v) }}</p>
          <p v-if="priceLabel(v)" class="shrink-0 text-sm text-gray-500">{{ priceLabel(v) }}</p>
          <QuantityStepper
            :input-id="stepperId(i, v)"
            :label="variantLabel(v)"
            :value="qtyFor(v.id)"
            :can-decrement="qtyFor(v.id) > 0"
            :can-increment="totalQty < maxQuantity"
            @decrement="setQty(v.id, qtyFor(v.id) - 1)"
            @increment="setQty(v.id, qtyFor(v.id) + 1)"
          />
        </div>
        <p v-if="maxQuantity > 1" class="mt-2 text-xs text-gray-500">Total: {{ totalQty }} of {{ maxQuantity }}</p>
      </div>
    </template>

    <ImageLightbox
      v-model:start-index="lightboxIndex"
      :is-open="lightboxOpen"
      :images="galleryImages"
      @close="lightboxOpen = false"
    />
  </div>
</template>
