// app/features/events/checkoutValidation.spec.ts
import type { Field } from '#core/field-engine/types'
import { describe, expect, it } from 'vitest'
import { validateCheckout } from './checkoutValidation'
import type { CartTicket, PublicEvent } from './types'

const nameField: Field = {
  id: 1,
  field_key: 'full_name',
  type: 'text',
  label: 'Full name',
  required: true,
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
const baseTicket = {
  id: 9,
  name: 'GA',
  description: null,
  price: 100,
  price_formatted: '₱100',
  early_bird_price: null,
  early_bird_ends_at: null,
  is_early_bird: false,
  early_bird_price_formatted: null,
  currency: 'PHP',
  is_on_sale: true,
  is_available: true,
  available_quantity: null,
  sales_start_at: null,
  sales_end_at: null,
  min_per_order: 1,
  max_per_order: 10,
  sort_order: 0,
  participant_type: 'single' as const,
  min_participants: 1,
  max_participants: 1,
  admits_per_ticket: 1,
  ask_group_name: false,
  group_name_label: '',
}
function event(over: Partial<PublicEvent> = {}): PublicEvent {
  return {
    id: 1,
    series_id: null,
    type: null,
    title: 'Hearts Run',
    slug: 'hearts-run',
    year: null,
    description: null,
    details: null,
    location: null,
    location_details: null,
    starts_at: '',
    ends_at: null,
    timezone: null,
    currency: 'PHP',
    is_featured: false,
    visibility: 'public',
    cover: null,
    has_capacity: false,
    available_capacity: null,
    tickets: [{ ...baseTicket, collect_details_later: false, participant_fields: [nameField] }],
    form_fields: null,
    ...over,
  }
}
const cart = (fd: Record<string, unknown>): CartTicket[] => [
  { uid: 'u1', ticket_id: 9, participants: [{ field_data: fd }] },
]

describe('validateCheckout', () => {
  it('flags a missing required participant field with the UI key shape', () => {
    const errors = validateCheckout(event(), cart({}), {})
    expect(errors['u1.0.full_name']).toBeTruthy()
  })

  it('passes when required participant fields are filled', () => {
    expect(validateCheckout(event(), cart({ full_name: 'Juan' }), {})).toEqual({})
  })

  it('skips participant validation for collect_details_later tickets', () => {
    const ev = event({ tickets: [{ ...baseTicket, collect_details_later: true, participant_fields: [nameField] }] })
    expect(validateCheckout(ev, cart({}), {})).toEqual({})
  })

  it('flags a missing required add-on by field_key', () => {
    const addon: Field = { ...nameField, id: 2, field_key: 'shirt', label: 'Shirt size' }
    const ev = event({ form_fields: [addon] })
    const errors = validateCheckout(ev, cart({ full_name: 'Juan' }), {})
    expect(errors['shirt']).toBeTruthy()
  })
})
