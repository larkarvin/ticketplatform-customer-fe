// Form/submission DTOs for the public form endpoints (snake_case). The neutral field shapes
// (Field/FieldGroup/FieldOption) live in the shared engine: #core/field-engine/types.
import type { Field, FieldGroup } from '#core/field-engine/types'

// Product field: the catalog data is embedded in the field's `settings.product` (no separate fetch).
// "product" is domain vocabulary, so these types + the ProductField control stay in the feature, not core.
export interface ProductVariantPrice {
  currency: string
  price: string
}
/** Subset of the backend ProductImageResource the renderer uses. */
export interface ProductImageMedia {
  id: number
  url: string
  thumb_url: string | null
  alt_text: string | null
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

export interface Form {
  id: number
  title: string
  slug: string
  description: string | null
  price: number
  surcharge_type: string
  surcharge_value: number
  currency: string
  enabled: boolean
  members_only: boolean
  allow_non_members: boolean
  requires_guest_email: boolean
  submission_deadline: string | null
  submit_button_text: string
  fields: Field[]
  field_groups: FieldGroup[]
}

export interface SubmitResult {
  message: string
  submission_id: number
  submission_slug: string
  edit_url: string
  requires_payment: boolean
}

export interface UploadedMedia {
  id: number
  uuid: string
  original_filename: string
  url: string
}

/** Answers keyed by field id, plus optional guest email. */
export type SubmitAnswers = Record<string, unknown> & { guest_email?: string }
