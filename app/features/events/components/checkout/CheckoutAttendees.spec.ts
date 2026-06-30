import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { CartTicket, PublicEvent, PublicTicket } from '../../types'
import CheckoutAttendees from './CheckoutAttendees.vue'

const nameField = {
  id: 1,
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
}

/** Ticket with one participant field (qualifies for a group card). */
const gaTicket: PublicTicket = {
  id: 9,
  name: 'GA',
  collect_details_later: false,
  participant_fields: [nameField],
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

/** Blank-field ticket — no fields, not collect_details_later → renders NO group card. */
const blankTicket: PublicTicket = {
  ...gaTicket,
  id: 10,
  name: 'Free',
  participant_fields: [],
  collect_details_later: false,
}

/** collect_details_later ticket — no fields, but should still render a (collapsed) group card. */
const laterTicket: PublicTicket = {
  ...gaTicket,
  id: 11,
  name: 'Later',
  participant_fields: [],
  collect_details_later: true,
}

/** Group ticket — has fields + add/remove participants. */
const groupTicket: PublicTicket = {
  ...gaTicket,
  id: 12,
  name: 'Group',
  participant_type: 'group',
  min_participants: 1,
  max_participants: 5,
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
      props: { event, cart: makeCart(['9-1']), identityKeyFor, errors: {} },
    })
    expect(w.findAllComponents({ name: 'ParticipantGroup' })).toHaveLength(1)
  })

  it('renders multiple ParticipantGroups for multiple cart instances', () => {
    const w = mount(CheckoutAttendees, {
      props: { event, cart: makeCart(['9-1', '9-2']), identityKeyFor, errors: {} },
    })
    expect(w.findAllComponents({ name: 'ParticipantGroup' })).toHaveLength(2)
  })

  it('forwards the remove event from a ParticipantGroup', async () => {
    const w = mount(CheckoutAttendees, {
      props: { event, cart: makeCart(['9-1']), identityKeyFor, errors: {} },
    })
    await w.get('[data-test=remove-group]').trigger('click')
    expect(w.emitted('remove')?.[0]).toEqual(['9-1'])
  })

  it('numbers instances per ticket_id (two of same type)', () => {
    const w = mount(CheckoutAttendees, {
      props: { event, cart: makeCart(['9-1', '9-2']), identityKeyFor, errors: {} },
    })
    const groups = w.findAllComponents({ name: 'ParticipantGroup' })
    expect(groups[0]?.props('instanceNumber')).toBe(1)
    expect(groups[1]?.props('instanceNumber')).toBe(2)
  })

  // ── Blank-field filtering ──────────────────────────────────────────────────

  it('renders NO ParticipantGroup for a blank-field ticket (no fields, not collect_details_later)', () => {
    const blankEvent = { ...event, tickets: [blankTicket] }
    const w = mount(CheckoutAttendees, {
      props: {
        event: blankEvent,
        cart: [{ uid: '10-1', ticket_id: 10, participants: [{ field_data: {} }] }],
        identityKeyFor,
        errors: {},
      },
    })
    expect(w.find('section').exists()).toBe(false)
    expect(w.findAllComponents({ name: 'ParticipantGroup' })).toHaveLength(0)
  })

  it('hides the whole section when no ticket has fields or collect_details_later', () => {
    const blankEvent = { ...event, tickets: [blankTicket] }
    const w = mount(CheckoutAttendees, {
      props: {
        event: blankEvent,
        cart: [
          { uid: '10-1', ticket_id: 10, participants: [{ field_data: {} }] },
          { uid: '10-2', ticket_id: 10, participants: [{ field_data: {} }] },
        ],
        identityKeyFor,
        errors: {},
      },
    })
    expect(w.find('section').exists()).toBe(false)
  })

  // ── collect_details_later ──────────────────────────────────────────────────

  it('renders a ParticipantGroup for a collect_details_later ticket even with no fields', () => {
    const laterEvent = { ...event, tickets: [laterTicket] }
    const w = mount(CheckoutAttendees, {
      props: {
        event: laterEvent,
        cart: [{ uid: '11-1', ticket_id: 11, participants: [{ field_data: {} }] }],
        identityKeyFor,
        errors: {},
      },
    })
    expect(w.find('section').exists()).toBe(true)
    expect(w.findAllComponents({ name: 'ParticipantGroup' })).toHaveLength(1)
  })

  // ── add-participant / remove-participant forwarding ────────────────────────

  it('forwards add-participant from a ParticipantGroup', async () => {
    const groupEvent = { ...event, tickets: [groupTicket] }
    const w = mount(CheckoutAttendees, {
      props: {
        event: groupEvent,
        cart: [{ uid: '12-1', ticket_id: 12, participants: [{ field_data: {} }] }],
        identityKeyFor,
        errors: {},
      },
    })
    // Body is open (first entry; defaultOpen=true). Add button visible for group under max.
    await w.get('[data-test=add-participant]').trigger('click')
    expect(w.emitted('add-participant')?.[0]).toEqual(['12-1'])
  })

  it('forwards remove-participant from a ParticipantGroup', async () => {
    const w = mount(CheckoutAttendees, {
      props: {
        event,
        // Two participants → participants.length (2) > min_participants (1) → canRemove=true
        cart: [{ uid: '9-1', ticket_id: 9, participants: [{ field_data: {} }, { field_data: {} }] }],
        identityKeyFor,
        errors: {},
      },
    })
    // Body open (first/only entry). First ParticipantCard (index 0) has canRemove=true.
    const removeButtons = w.findAll('[data-test=remove]')
    await removeButtons[0]!.trigger('click')
    expect(w.emitted('remove-participant')?.[0]).toEqual(['9-1', 0])
  })

  // ── Error summary banner ───────────────────────────────────────────────────

  it('shows no summary banner when there are no errors', () => {
    const w = mount(CheckoutAttendees, {
      props: { event, cart: makeCart(['9-1']), identityKeyFor, errors: {} },
    })
    expect(w.find('[role=alert]').exists()).toBe(false)
  })

  it('summarises how many people still need details (singular vs plural)', () => {
    const one = mount(CheckoutAttendees, {
      props: { event, cart: makeCart(['9-1']), identityKeyFor, errors: { '9-1.0.full_name': 'x' } },
    })
    expect(one.get('[role=alert]').text()).toContain('1 person')

    const many = mount(CheckoutAttendees, {
      props: {
        event,
        cart: makeCart(['9-1', '9-2']),
        identityKeyFor,
        errors: { '9-1.0.full_name': 'x', '9-2.0.full_name': 'x' },
      },
    })
    expect(many.get('[role=alert]').text()).toContain('2 people')
  })
})
