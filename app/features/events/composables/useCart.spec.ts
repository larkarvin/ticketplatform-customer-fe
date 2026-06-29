import { describe, expect, it } from 'vitest'
import type { PublicEvent } from '../types'
import { useCart } from './useCart'

const ticket = (over: Partial<PublicEvent['tickets'][number]>) =>
  ({
    id: 9,
    name: 'Group',
    price: 100,
    admits_per_ticket: 3,
    participant_type: 'group',
    min_per_order: 1,
    max_per_order: 4,
    available_quantity: null,
    collect_details_later: false,
    participant_fields: [],
    ask_group_name: true,
    group_name_label: 'Team name',
    ...over,
  }) as PublicEvent['tickets'][number]
const event = (t: PublicEvent['tickets'][number]) => ({ tickets: [t] }) as PublicEvent

describe('useCart', () => {
  it('seeds one instance per quantity, each with admits_per_ticket members', () => {
    const c = useCart(event(ticket({})), [{ ticket_id: 9, quantity: 2 }])
    expect(c.cart.value).toHaveLength(2)
    expect(c.cart.value[0]!.participants).toHaveLength(3)
    expect(c.quantityOf(9)).toBe(2)
  })

  it('addTicket appends an instance up to max_per_order; removeTicket drops by uid', () => {
    const c = useCart(event(ticket({ max_per_order: 2 })), [{ ticket_id: 9, quantity: 1 }])
    c.addTicket(9)
    expect(c.quantityOf(9)).toBe(2)
    c.addTicket(9) // at max → no-op
    expect(c.quantityOf(9)).toBe(2)
    c.removeTicket(c.cart.value[0]!.uid)
    expect(c.quantityOf(9)).toBe(1)
  })

  it('serializeToQuery reflects current quantities', () => {
    const c = useCart(event(ticket({})), [{ ticket_id: 9, quantity: 2 }])
    expect(c.serializeToQuery()).toBe('9:2')
  })
})
