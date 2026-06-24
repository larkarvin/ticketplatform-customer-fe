// Plain-words label for a product variant — shared by the product control and the review summary so
// both phrase a chosen variant the same way.
import type { ProductVariant } from '~/features/forms/types'

/** A variant in plain words: its attribute values joined ("Medium – Red"), else the variant name. */
export function variantLabel(v: ProductVariant): string {
  const values = v.attribute_values.map((a) => a.value).filter(Boolean)
  return values.length ? values.join(' – ') : v.name
}
