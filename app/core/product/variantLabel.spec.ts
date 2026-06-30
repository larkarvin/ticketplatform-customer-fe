import { describe, expect, it } from 'vitest'
import type { ProductVariant } from '~/core/types/product'
import { variantLabel } from './variantLabel'

const base: ProductVariant = {
  id: 1,
  name: 'Large Red',
  sku: null,
  is_active: true,
  image: null,
  attribute_values: [],
  prices: [],
}

describe('variantLabel', () => {
  it('joins attribute values when present', () => {
    const v = {
      ...base,
      attribute_values: [
        { attribute: 'Size', value: 'Medium' },
        { attribute: 'Color', value: 'Red' },
      ],
    }
    expect(variantLabel(v)).toBe('Medium – Red')
  })

  it('falls back to variant name when no attribute values', () => {
    expect(variantLabel(base)).toBe('Large Red')
  })

  it('filters out empty values before joining', () => {
    const v = {
      ...base,
      attribute_values: [
        { attribute: null, value: '' },
        { attribute: 'Color', value: 'Blue' },
      ],
    }
    expect(variantLabel(v)).toBe('Blue')
  })
})
