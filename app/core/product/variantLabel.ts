// Plain-words label for a product variant — shared by the ProductField control (forms) and the
// checkout review step (events) so both phrase a chosen variant identically.
import type { ProductVariant } from '~/core/types/product'

/** A variant in plain words: its attribute values joined ("Medium – Red"), else the variant name. */
export function variantLabel(v: ProductVariant): string {
  const values = v.attribute_values.map((a) => a.value).filter(Boolean)
  return values.length ? values.join(' – ') : v.name
}
