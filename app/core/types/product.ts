// Shared product-catalog types consumed by both the forms feature (ProductField control) and the
// events feature (checkout review). Both are real consumers → qualifies for app/core.
// "product" is domain vocabulary per the no-domain-vocab-in-core rule, but customer-fe has not yet
// ported that lint rule (it is 🔸 convention here). These belong in core because they clear all three
// bars: 2+ real consumers (forms + events), single responsibility (product catalog DTO shapes), and
// no fe-core (app-level only).

/** Subset of the backend ProductImageResource the renderer uses. */
export interface ProductImageMedia {
  id: number
  url: string
  thumb_url: string | null
  alt_text: string | null
}

export interface ProductVariantPrice {
  currency: string
  price: string
}

export interface ProductAttributeValue {
  attribute: string | null
  value: string
}

export interface ProductVariant {
  id: number
  name: string
  sku: string | null
  is_active: boolean
  image: ProductImageMedia | null
  attribute_values: ProductAttributeValue[]
  prices: ProductVariantPrice[]
}

export interface ProductFieldInfo {
  id: number
  name: string
  image: ProductImageMedia | null
  variants: ProductVariant[]
}

/** The submit value of a product field: an array of variant selections (total qty ≤ max_quantity). */
export interface ProductSelection {
  variant_id: number
  quantity: number
}
