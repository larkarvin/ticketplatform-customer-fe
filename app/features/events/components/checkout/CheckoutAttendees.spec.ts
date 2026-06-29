import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CheckoutAttendees from './CheckoutAttendees.vue'

const ga = {
  id: 1,
  name: 'GA',
  collect_details_later: false,
  participant_fields: [
    {
      id: 9,
      field_key: 'full_name',
      type: 'text',
      label: 'Full name',
      required: true,
      col_span: 12,
      options: [],
      settings: {},
      visibility: 'public' as const,
      description: null,
      placeholder: null,
      min: null,
      max: null,
      allow_decimal: null,
      field_group_id: null,
      sort_order: 0,
    },
  ],
  description: null,
  price: 100,
  price_formatted: '₱100.00',
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

describe('CheckoutAttendees', () => {
  it('renders one labelled field per admit', () => {
    const answers: Record<number, Array<Record<string, unknown>>> = { 1: [{}, {}] }
    const w = mount(CheckoutAttendees, {
      props: { tickets: [ga], selection: [{ ticket_id: 1, quantity: 2 }], answers, errors: {} },
    })
    expect(w.findAll('label').filter((l) => l.text().includes('Full name'))).toHaveLength(2)
  })

  it('skips tickets flagged collect_details_later', () => {
    const later = { ...ga, collect_details_later: true }
    const w = mount(CheckoutAttendees, {
      props: { tickets: [later], selection: [{ ticket_id: 1, quantity: 1 }], answers: { 1: [{}] }, errors: {} },
    })
    expect(w.text()).not.toContain('Full name')
  })
})
