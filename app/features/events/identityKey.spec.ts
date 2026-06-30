import type { Field } from '#core/field-engine/types'
import { describe, expect, it } from 'vitest'
import { identityKey } from './identityKey'

const base: Field = {
  id: 1,
  field_key: 'f1',
  type: 'text',
  label: 'Field',
  required: false,
  col_span: 12,
  options: [],
  settings: {},
  visibility: 'public',
  description: null,
  placeholder: null,
  min: null,
  max: null,
  allow_decimal: null,
  field_group_id: null,
  sort_order: 0,
}

describe('identityKey', () => {
  it('returns null for an empty field list', () => {
    expect(identityKey([])).toBeNull()
  })

  it('returns the first required text field key', () => {
    const fields: Field[] = [
      { ...base, field_key: 'email', type: 'email', required: true },
      { ...base, field_key: 'full_name', type: 'text', required: true },
    ]
    expect(identityKey(fields)).toBe('full_name')
  })

  it('treats "name" type as an identity field', () => {
    const fields: Field[] = [{ ...base, field_key: 'name', type: 'name', required: true }]
    expect(identityKey(fields)).toBe('name')
  })

  it('falls back to the first field key when no required text/name field exists', () => {
    const fields: Field[] = [
      { ...base, field_key: 'shirt', type: 'select', required: false },
      { ...base, field_key: 'note', type: 'text', required: false },
    ]
    expect(identityKey(fields)).toBe('shirt')
  })
})
