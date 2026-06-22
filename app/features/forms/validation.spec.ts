import { describe, expect, it } from 'vitest'
import type { Field } from './types'
import { validateAll, validateField } from './validation'

function field(p: Partial<Field>): Field {
  return {
    id: 1,
    field_group_id: null,
    field_key: 'k',
    type: 'text',
    label: 'Name',
    placeholder: null,
    description: null,
    required: false,
    visibility: 'public',
    min: null,
    max: null,
    allow_decimal: null,
    settings: {},
    sort_order: 0,
    col_span: 12,
    options: [],
    ...p,
  }
}

describe('validateField', () => {
  it('flags required empties', () => {
    expect(validateField(field({ required: true }), '')).toBe('Name is required')
    expect(validateField(field({ required: true }), 'Jo')).toBeNull()
  })
  it('checks email format', () => {
    expect(validateField(field({ type: 'email' }), 'nope')).toBe('Enter a valid email address')
    expect(validateField(field({ type: 'email' }), 'a@b.co')).toBeNull()
  })
  it('checks number incl. min/max and decimals', () => {
    expect(validateField(field({ type: 'number' }), 'x')).toBe('Enter a number')
    expect(validateField(field({ type: 'number', allow_decimal: false }), '1.5')).toBe('Enter a whole number')
    expect(validateField(field({ type: 'number', min: 5 }), '3')).toBe('Must be at least 5')
    expect(validateField(field({ type: 'number', max: 5 }), '7')).toBe('Must be at most 5')
    expect(validateField(field({ type: 'number' }), '4')).toBeNull()
  })
  it('checks select value is a known option', () => {
    const f = field({
      type: 'select',
      options: [{ id: 1, option_key: 'a', value: 'a', label: 'A', price: null, sort_order: 0 }],
    })
    expect(validateField(f, 'b')).toBe('Choose one of the options')
    expect(validateField(f, 'a')).toBeNull()
  })
  it('skips display-only and readonly fields', () => {
    expect(validateField(field({ type: 'paragraph', required: true }), '')).toBeNull()
    expect(validateField(field({ visibility: 'readonly', required: true }), '')).toBeNull()
  })
})

describe('validateAll', () => {
  it('returns a map of id -> first error', () => {
    const fields = [field({ id: 1, required: true }), field({ id: 2, type: 'email', required: true })]
    const errors = validateAll(fields, { '1': '', '2': 'bad' })
    expect(errors).toEqual({ 1: 'Name is required', 2: 'Enter a valid email address' })
  })
})
