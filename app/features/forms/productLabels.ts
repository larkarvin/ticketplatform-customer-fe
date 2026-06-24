// Plain-words labels for product variants and selections — shared by the product control and the
// review summary so both phrase a chosen variant the same way.
import type { ProductSelection, ProductVariant } from '~/features/forms/types'

/** A variant in plain words: its attribute values joined ("Medium – Red"), else the variant name. */
export function variantLabel(v: ProductVariant): string {
  const values = v.attribute_values.map((a) => a.value).filter(Boolean)
  return values.length ? values.join(' – ') : v.name
}

/** Selected variants as plain-words lines ("1 × Medium – Red"), skipping any the catalog no longer has. */
export function summariseSelections(selections: ProductSelection[], variants: ProductVariant[]): string[] {
  return selections
    .map((s) => {
      const v = variants.find((vr) => vr.id === s.variant_id)
      return v ? `${s.quantity} × ${variantLabel(v)}` : null
    })
    .filter((row): row is string => row !== null)
}
