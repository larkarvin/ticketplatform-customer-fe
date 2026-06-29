import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { CartTicket, PublicEvent, PublicTicket } from '../../types'
import CheckoutAttendees from './CheckoutAttendees.vue'

const gaTicket: PublicTicket = {
  id: 9,
  name: 'GA',
  collect_details_later: false,
  participant_fields: [
    {
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
  participant_type: 'single',
  min_participants: 1,
  max_participants: 1,
  admits_per_ticket: 1,
  ask_group_name: false,
  group_name_label: '',
}

const event: PublicEvent = {
  id: 1,
  series_id: null,
  type: null,
  title: 'Test Event',
  slug: 'test-event',
  year: null,
  description: null,
  details: null,
  location: null,
  location_details: null,
  starts_at: '2026-01-01T00:00:00Z',
  ends_at: null,
  timezone: null,
  currency: 'PHP',
  is_featured: false,
  visibility: 'public',
  cover: null,
  has_capacity: false,
  available_capacity: null,
  tickets: [gaTicket],
  form_fields: null,
}

const makeCart = (uids: string[]): CartTicket[] =>
  uids.map((uid) => ({ uid, ticket_id: 9, participants: [{ field_data: {} }] }))

const identityKeyFor = () => 'full_name'

describe('CheckoutAttendees', () => {
  it('renders one ParticipantGroup per cart instance', () => {
    const w = mount(CheckoutAttendees, {
      props: {
        event,
        cart: makeCart(['9-1']),
        identityKeyFor,
        errors: {},
        buyerName: '',
      },
    })
    expect(w.findAllComponents({ name: 'ParticipantGroup' })).toHaveLength(1)
  })

  it('renders multiple ParticipantGroups for multiple cart instances', () => {
    const w = mount(CheckoutAttendees, {
      props: {
        event,
        cart: makeCart(['9-1', '9-2']),
        identityKeyFor,
        errors: {},
        buyerName: '',
      },
    })
    expect(w.findAllComponents({ name: 'ParticipantGroup' })).toHaveLength(2)
  })

  it('passes showPrefill=true only on the first instance overall', () => {
    const w = mount(CheckoutAttendees, {
      props: {
        event,
        cart: makeCart(['9-1', '9-2']),
        identityKeyFor,
        errors: {},
        buyerName: '',
      },
    })
    const groups = w.findAllComponents({ name: 'ParticipantGroup' })
    expect(groups[0]?.props('showPrefill')).toBe(true)
    expect(groups[1]?.props('showPrefill')).toBe(false)
  })

  it('forwards the remove event from a ParticipantGroup', async () => {
    const w = mount(CheckoutAttendees, {
      props: {
        event,
        cart: makeCart(['9-1']),
        identityKeyFor,
        errors: {},
        buyerName: '',
      },
    })
    await w.get('[data-test=remove-group]').trigger('click')
    expect(w.emitted('remove')?.[0]).toEqual(['9-1'])
  })

  it('hides the section when all tickets are collect_details_later', () => {
    const later: PublicTicket = { ...gaTicket, collect_details_later: true }
    const laterEvent = { ...event, tickets: [later] }
    const w = mount(CheckoutAttendees, {
      props: {
        event: laterEvent,
        cart: makeCart(['9-1']),
        identityKeyFor,
        errors: {},
        buyerName: '',
      },
    })
    expect(w.find('section').exists()).toBe(false)
  })

  it('numbers instances per ticket_id (two of same type)', () => {
    const w = mount(CheckoutAttendees, {
      props: {
        event,
        cart: makeCart(['9-1', '9-2']),
        identityKeyFor,
        errors: {},
        buyerName: '',
      },
    })
    const groups = w.findAllComponents({ name: 'ParticipantGroup' })
    expect(groups[0]?.props('instanceNumber')).toBe(1)
    expect(groups[1]?.props('instanceNumber')).toBe(2)
  })
})
