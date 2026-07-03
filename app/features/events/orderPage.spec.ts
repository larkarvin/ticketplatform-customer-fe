import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseSelection } from './cart'
import { useOrderStatus } from './composables/useOrderStatus'
import { buildTicketsQuery, formatCountdown, seedStatus } from './orderPage'
import { ordersService } from './services/orders.service'
import type { PublicOrder } from './types'

describe('formatCountdown', () => {
  it('returns empty string for null', () => {
    expect(formatCountdown(null)).toBe('')
  })

  it('returns empty string for negative values', () => {
    expect(formatCountdown(-1)).toBe('')
    expect(formatCountdown(-100)).toBe('')
  })

  it('formats 0 as 00:00', () => {
    expect(formatCountdown(0)).toBe('00:00')
  })

  it('formats seconds only (< 60)', () => {
    expect(formatCountdown(5)).toBe('00:05')
    expect(formatCountdown(59)).toBe('00:59')
  })

  it('formats exactly 1 minute', () => {
    expect(formatCountdown(60)).toBe('01:00')
  })

  it('formats 90 seconds as 01:30', () => {
    expect(formatCountdown(90)).toBe('01:30')
  })

  it('formats 600 seconds as 10:00', () => {
    expect(formatCountdown(600)).toBe('10:00')
  })

  it('formats 3661 seconds (1h 1m 1s) — shows only mm:ss portion', () => {
    expect(formatCountdown(3661)).toBe('61:01')
  })
})

// ---------------------------------------------------------------------------
// buildTicketsQuery
// ---------------------------------------------------------------------------

function makeOrder(overrides: Partial<PublicOrder> = {}): PublicOrder {
  return {
    public_id: '11111111-1111-4111-8111-111111111111',
    order_number: 'ORD-001',
    currency: 'USD',
    total: '100.00',
    payment_status: 'failed',
    expires_at: null,
    can_be_paid: false,
    event_slug: 'my-event',
    items: [],
    ...overrides,
  }
}

describe('buildTicketsQuery', () => {
  it('returns null when event_slug is null', () => {
    const order = makeOrder({ event_slug: null })
    expect(buildTicketsQuery(order)).toBeNull()
  })

  it('returns null when there are no ticket lines', () => {
    const order = makeOrder({
      items: [{ type: 'addon', name: 'T-shirt', quantity: 1, unit_price: '10.00', subtotal: '10.00', ticket_id: null }],
    })
    expect(buildTicketsQuery(order)).toBeNull()
  })

  it('builds id:qty pairs from ticket lines (ids 12 qty2, 15 qty1), skipping non-ticket lines', () => {
    const order = makeOrder({
      event_slug: 'summer-fest',
      items: [
        { type: 'ticket', name: 'General', quantity: 2, unit_price: '20.00', subtotal: '40.00', ticket_id: 12 },
        { type: 'ticket', name: 'VIP', quantity: 1, unit_price: '50.00', subtotal: '50.00', ticket_id: 15 },
        { type: 'addon', name: 'Merch', quantity: 1, unit_price: '10.00', subtotal: '10.00', ticket_id: null },
      ],
    })
    expect(buildTicketsQuery(order)).toBe('12:2,15:1')
  })

  it('produces a string the checkout parser (parseSelection) round-trips exactly', () => {
    const order = makeOrder({
      items: [
        { type: 'ticket', name: 'General', quantity: 2, unit_price: '20.00', subtotal: '40.00', ticket_id: 12 },
        { type: 'ticket', name: 'VIP', quantity: 1, unit_price: '50.00', subtotal: '50.00', ticket_id: 15 },
      ],
    })
    const query = buildTicketsQuery(order)!
    expect(parseSelection(query)).toEqual([
      { ticket_id: 12, quantity: 2 },
      { ticket_id: 15, quantity: 1 },
    ])
  })
})

// ---------------------------------------------------------------------------
// seedStatus
// ---------------------------------------------------------------------------

describe('seedStatus', () => {
  it('returns processing when returning from a successful gateway on a pending order', () => {
    expect(seedStatus('pending', 'success')).toBe('processing')
  })

  it('does not override a paid order even with status=success', () => {
    expect(seedStatus('paid', 'success')).toBe('paid')
  })

  it('passes the payment status through on the normal (no return status) path', () => {
    expect(seedStatus('pending', undefined)).toBe('pending')
    expect(seedStatus('failed', undefined)).toBe('failed')
  })

  it('ignores non-success return statuses', () => {
    expect(seedStatus('pending', 'cancelled')).toBe('pending')
    expect(seedStatus('pending', 'failed')).toBe('pending')
  })
})

// seedStatus feeds useOrderStatus — verify the end-to-end UI seed + poll transition.
vi.mock('./services/orders.service', () => ({
  ordersService: { paymentStatus: vi.fn() },
}))

describe('order page status seed (gateway return) + poll transition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('returning with status=success + pending order starts processing, then transitions on poll', async () => {
    vi.mocked(ordersService.paymentStatus).mockResolvedValue({ success: true, status: 'paid' })

    const { state } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: seedStatus('pending', 'success'),
      expires_at: null,
    })

    // Seeded as processing — NOT awaiting — so no "Resume payment" + countdown is shown.
    expect(state.value).toBe('processing')

    // First poll resolves the real outcome.
    await vi.advanceTimersByTimeAsync(2_100)
    expect(state.value).toBe('paid')
  })
})
