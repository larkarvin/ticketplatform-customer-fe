import { describe, expect, it } from 'vitest'
import { buildRebuildDraft, formatCountdown } from './orderPage'
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
// buildRebuildDraft
// ---------------------------------------------------------------------------

function makeOrder(overrides: Partial<PublicOrder> = {}): PublicOrder {
  return {
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

describe('buildRebuildDraft', () => {
  it('returns null when event_slug is null', () => {
    const order = makeOrder({ event_slug: null })
    expect(buildRebuildDraft(order)).toBeNull()
  })

  it('returns null when there are no ticket lines', () => {
    const order = makeOrder({
      items: [{ type: 'addon', name: 'T-shirt', quantity: 1, unit_price: '10.00', subtotal: '10.00', ticket_id: null }],
    })
    expect(buildRebuildDraft(order)).toBeNull()
  })

  it('builds a draft with one CartTicket per ticket-line quantity', () => {
    const order = makeOrder({
      event_slug: 'summer-fest',
      items: [
        { type: 'ticket', name: 'General', quantity: 2, unit_price: '20.00', subtotal: '40.00', ticket_id: 7 },
        { type: 'ticket', name: 'VIP', quantity: 1, unit_price: '50.00', subtotal: '50.00', ticket_id: 9 },
        { type: 'addon', name: 'Merch', quantity: 1, unit_price: '10.00', subtotal: '10.00', ticket_id: null },
      ],
    })
    const draft = buildRebuildDraft(order)
    expect(draft).not.toBeNull()
    // 2 × ticket 7 + 1 × ticket 9 = 3 CartTicket instances
    expect(draft!.tickets).toHaveLength(3)
    expect(draft!.tickets.filter((t) => t.ticket_id === 7)).toHaveLength(2)
    expect(draft!.tickets.filter((t) => t.ticket_id === 9)).toHaveLength(1)
  })

  it('each CartTicket has a uid string and empty participants', () => {
    const order = makeOrder({
      items: [{ type: 'ticket', name: 'GA', quantity: 2, unit_price: '10.00', subtotal: '20.00', ticket_id: 3 }],
    })
    const draft = buildRebuildDraft(order)!
    for (const ticket of draft.tickets) {
      expect(typeof ticket.uid).toBe('string')
      expect(ticket.uid.length).toBeGreaterThan(0)
      expect(ticket.participants).toEqual([])
    }
  })

  it('generates distinct uids for each ticket instance', () => {
    const order = makeOrder({
      items: [{ type: 'ticket', name: 'GA', quantity: 3, unit_price: '10.00', subtotal: '30.00', ticket_id: 5 }],
    })
    const draft = buildRebuildDraft(order)!
    const uids = draft.tickets.map((t) => t.uid)
    expect(new Set(uids).size).toBe(3)
  })

  it('sets checkoutAnswers to empty object and email to empty string', () => {
    const order = makeOrder({
      items: [{ type: 'ticket', name: 'GA', quantity: 1, unit_price: '10.00', subtotal: '10.00', ticket_id: 1 }],
    })
    const draft = buildRebuildDraft(order)!
    expect(draft.checkoutAnswers).toEqual({})
    expect(draft.email).toBe('')
  })
})
