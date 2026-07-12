// Form/submission DTOs for the public form endpoints (snake_case). The neutral field shapes
// (Field/FieldGroup/FieldOption) live in the shared engine: #core/field-engine/types.
import type { Field, FieldGroup } from '#core/field-engine/types'

// Product-catalog types are shared with the events feature — they live in app/core and are
// re-exported here so forms-internal imports keep working without any churn.
export type {
  ProductAttributeValue,
  ProductFieldInfo,
  ProductImageMedia,
  ProductSelection,
  ProductVariant,
  ProductVariantPrice,
} from '~/core/types/product'

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
  /** Always present — an Order is created for every submission (even $0). */
  public_id: string
  /** Only present when requires_payment is true. */
  order_number?: string
  payment_total?: number
}

export interface UploadedMedia {
  id: number
  uuid: string
  original_filename: string
  url: string
}

/** Answers keyed by field id, plus optional guest email. */
export type SubmitAnswers = Record<string, unknown> & { guest_email?: string }

// Server-computed price breakdown for a priced submission (POST /forms/public/{slug}/calculate).
export interface PaymentLineItem {
  /** The line's display name — the canonical key the preview engine sends for every line
   *  (base price, ticket, add-on). Prefer this; the *_label/product_name fields are optional
   *  richer variants that may be absent. */
  label?: string
  field_label?: string
  /** The product's name for product line items (absent for priced select options). */
  product_name?: string
  /** Plain-words label for the chosen option/variant; falls back to the field label. */
  option_label?: string
  quantity: number
  unit_price: number
  amount: number
}
export interface PaymentFee {
  label: string
  amount: number
}
export interface PaymentBreakdown {
  currency: string
  items: PaymentLineItem[]
  fees: PaymentFee[]
  subtotal: number
  fees_total: number
  total: number
}
