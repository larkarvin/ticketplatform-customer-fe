// app/features/events/checkoutReview.spec.ts
import type { Field } from '#core/field-engine/types'
import { describe, expect, it } from 'vitest'
import { EDIT_ADDONS, EDIT_ATTENDEES, buildReviewGroups, firstOrderEmail } from './checkoutReview'
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
const ticket = {
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
  collect_details_later: false,
  participant_fields: [nameField],
}
function event(over: Partial<PublicEvent> = {}): PublicEvent {
  return {
    id: 1,
    series_id: null,
    type: null,
    title: 'x',
    slug: 'x',
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
    tickets: [ticket],
    form_fields: null,
    ...over,
  }
}
const cart: CartTicket[] = [
  { uid: 'u1', ticket_id: 9, participants: [{ field_data: { full_name: 'Juan dela Cruz' } }] },
]

describe('buildReviewGroups', () => {
  it("builds a Who's coming group with the participant name", () => {
    const groups = buildReviewGroups(event(), cart, {})
    expect(groups[0]?.editTarget).toBe(EDIT_ATTENDEES)
    expect(groups[0]?.title).toBe("Who's coming")
    expect(groups[0]?.items[0]?.value).toBe('Juan dela Cruz')
  })

  it("omits Who's coming when no purchased ticket collects attendee details", () => {
    const bareTicket = { ...ticket, participant_fields: [] as Field[], collect_details_later: false }
    const ev = event({ tickets: [bareTicket] })
    const groups = buildReviewGroups(ev, cart, {})
    expect(groups.find((g) => g.editTarget === EDIT_ATTENDEES)).toBeUndefined()
  })

  it('omits the add-ons group when nothing is answered', () => {
    const addon: Field = { ...nameField, id: 2, field_key: 'shirt', label: 'Shirt' }
    const groups = buildReviewGroups(event({ form_fields: [addon] }), cart, {})
    expect(groups.find((g) => g.editTarget === EDIT_ADDONS)).toBeUndefined()
  })

  it('includes answered add-ons with select option labels', () => {
    const addon: Field = {
      ...nameField,
      id: 2,
      field_key: 'shirt',
      label: 'Shirt',
      type: 'select',
      options: [{ option_key: 'l', label: 'Large', sort_order: 0 }] as Field['options'],
    }
    const groups = buildReviewGroups(event({ form_fields: [addon] }), cart, { shirt: 'l' })
    const addons = groups.find((g) => g.editTarget === EDIT_ADDONS)
    expect(addons?.items[0]).toMatchObject({ label: 'Shirt', value: 'Large' })
  })

  it('formats a product add-on with its variant label (never [object Object])', () => {
    const productField: Field = {
      ...nameField,
      id: 3,
      field_key: 'shirt',
      label: 'Shirt',
      type: 'product',
      settings: {
        product: { name: 'Shirt', variants: [{ id: 5, name: 'L', attribute_values: [{ value: 'Large' }] }] },
      },
    }
    const groups = buildReviewGroups(event({ form_fields: [productField] }), cart, {
      shirt: [{ variant_id: 5, quantity: 2 }],
    })
    const addons = groups.find((g) => g.editTarget === EDIT_ADDONS)
    expect(addons?.items[0]?.value).toBe('2 × Shirt (Large)')
  })
})

const emailField: Field = { ...nameField, id: 7, field_key: 'email', type: 'email', label: 'Email', required: false }

describe('firstOrderEmail', () => {
  const ticketWithEmail = { ...ticket, participant_fields: [nameField, emailField] }

  it('returns the first participant email entered, in reading order', () => {
    const ev = event({ tickets: [ticketWithEmail] })
    const c: CartTicket[] = [
      {
        uid: 'u1',
        ticket_id: 9,
        participants: [{ field_data: {} }, { field_data: { email: 'parent@example.com' } }],
      },
    ]
    expect(firstOrderEmail(ev, c, {})).toBe('parent@example.com')
  })

  it('falls back to an order-level email extra when no participant has one', () => {
    const ev = event({ tickets: [ticketWithEmail], form_fields: [{ ...emailField, field_key: 'contact' }] })
    const c: CartTicket[] = [{ uid: 'u1', ticket_id: 9, participants: [{ field_data: {} }] }]
    expect(firstOrderEmail(ev, c, { contact: 'buyer@example.com' })).toBe('buyer@example.com')
  })

  it('returns empty string when no email has been entered anywhere', () => {
    const ev = event({ tickets: [ticketWithEmail] })
    const c: CartTicket[] = [{ uid: 'u1', ticket_id: 9, participants: [{ field_data: {} }] }]
    expect(firstOrderEmail(ev, c, {})).toBe('')
  })
})
