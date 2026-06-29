import type { Field } from '#core/field-engine/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CartTicket, PublicEvent } from '~/features/events/types'
import { usePublicCheckout } from './usePublicCheckout'

const { calculateOrder } = vi.hoisted(() => ({ calculateOrder: vi.fn() }))
vi.mock('~/features/events/services/events.service', () => ({ eventsService: { calculateOrder } }))

function event(): PublicEvent {
  return {
    id: 1,
    series_id: null,
    type: null,
    title: 'Gala',
    slug: 'gala',
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
    form_fields: null,
    tickets: [
      {
        id: 1,
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
        collect_details_later: false,
        participant_fields: [],
        participant_type: 'single' as const,
        min_participants: 1,
        max_participants: 1,
        admits_per_ticket: 1,
        ask_group_name: false,
        group_name_label: 'Group name',
      },
    ],
  }
}

function mockCalcResult() {
  return {
    currency: 'PHP',
    items: [],
    subtotal: 200,
    fees: [],
    fees_total: 0,
    taxes: [],
    taxes_total: 0,
    total: 200,
  }
}

describe('usePublicCheckout', () => {
  beforeEach(() => {
    calculateOrder.mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('buildCalcPayload emits one entry per cart instance carrying group_name', async () => {
    calculateOrder.mockResolvedValue(mockCalcResult())

    const cart = ref<CartTicket[]>([
      {
        uid: 'a',
        ticket_id: 1,
        group_name: 'Table A',
        participants: [{ field_data: { name: 'Alice' } }],
      },
      {
        uid: 'b',
        ticket_id: 1,
        group_name: 'Table B',
        participants: [{ field_data: { name: 'Bob' } }],
      },
    ])

    const c = usePublicCheckout(event(), cart)
    c.recalcTotals()
    await vi.runAllTimersAsync()

    expect(calculateOrder).toHaveBeenCalledWith(
      'gala',
      expect.objectContaining({
        tickets: [
          { ticket_id: 1, quantity: 1, group_name: 'Table A', participants: [{ field_data: { name: 'Alice' } }] },
          { ticket_id: 1, quantity: 1, group_name: 'Table B', participants: [{ field_data: { name: 'Bob' } }] },
        ],
      })
    )
  })

  it('omits group_name when undefined on the instance', async () => {
    calculateOrder.mockResolvedValue(mockCalcResult())

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])

    const c = usePublicCheckout(event(), cart)
    c.recalcTotals()
    await vi.runAllTimersAsync()

    const [, payload] = calculateOrder.mock.calls[0] as [string, { tickets: Array<{ group_name?: string }> }]
    expect(payload.tickets[0]?.group_name).toBeUndefined()
  })

  it('exposes calculation after a successful recalc', async () => {
    calculateOrder.mockResolvedValue(mockCalcResult())

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [] }])
    const c = usePublicCheckout(event(), cart)

    expect(c.calculation.value).toBeNull()
    c.recalcTotals()
    await vi.runAllTimersAsync()
    expect(c.calculation.value?.total).toBe(200)
  })
})

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
const eventWithField = {
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
  tickets: [
    {
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
    },
  ],
  form_fields: null,
} as PublicEvent

describe('usePublicCheckout.validate', () => {
  it('returns false and records errors when required fields are empty', () => {
    const cart = ref<CartTicket[]>([{ uid: 'u1', ticket_id: 9, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(eventWithField, cart)
    expect(c.validate()).toBe(false)
    expect(c.fieldErrors.value['u1.0.full_name']).toBeTruthy()
  })

  it('returns true and clears errors when valid', () => {
    const cart = ref<CartTicket[]>([{ uid: 'u1', ticket_id: 9, participants: [{ field_data: { full_name: 'Juan' } }] }])
    const c = usePublicCheckout(eventWithField, cart)
    expect(c.validate()).toBe(true)
    expect(Object.keys(c.fieldErrors.value)).toHaveLength(0)
  })
})
