// DTOs for the public form endpoints (snake_case as returned by the API).

// Product field: the catalog data is embedded in the field's `settings.product` (no separate fetch).
export interface ProductVariantPrice {
  currency: string
  price: string
}
export interface ProductVariant {
  id: number
  name: string
  sku: string | null
  is_active: boolean
  prices: ProductVariantPrice[]
}
export interface ProductFieldInfo {
  id: number
  name: string
  variants: ProductVariant[]
}
/** The submit value of a product field: an array of variant selections (total qty ≤ max_quantity). */
export interface ProductSelection {
  variant_id: number
  quantity: number
}

export interface FieldOption {
  id: number
  option_key: string
  value: string
  label: string
  price: number | null
  sort_order: number
}

export interface Field {
  id: number
  field_group_id: number | null
  field_key: string
  type: string
  label: string
  placeholder: string | null
  description: string | null
  required: boolean
  visibility: 'public' | 'readonly' | 'admin'
  min: number | null
  max: number | null
  allow_decimal: boolean | null
  settings: Record<string, unknown>
  sort_order: number
  col_span: number
  options: FieldOption[]
}

export interface FieldGroup {
  id: number
  title: string
  description: string | null
  sort_order: number
  fields: Field[]
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
