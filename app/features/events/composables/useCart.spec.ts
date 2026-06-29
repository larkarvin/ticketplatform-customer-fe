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
    min_participants: 2,
    max_participants: 5,
    ...over,
  }) as PublicEvent['tickets'][number]
const event = (t: PublicEvent['tickets'][number]) => ({ tickets: [t] }) as PublicEvent

describe('useCart', () => {
  it('seeds each instance with min_participants participants (not admits_per_ticket)', () => {
    const c = useCart(event(ticket({})), [{ ticket_id: 9, quantity: 2 }])
    expect(c.cart.value).toHaveLength(2)
    expect(c.cart.value[0]!.participants).toHaveLength(2) // min_participants = 2
    expect(c.cart.value[1]!.participants).toHaveLength(2)
    expect(c.quantityOf(9)).toBe(2)
  })

  it('group: addParticipant adds up to max_participants then no-ops', () => {
    // min=2, max=5; seeded at 2
    const c = useCart(event(ticket({ min_participants: 2, max_participants: 3 })), [{ ticket_id: 9, quantity: 1 }])
    const uid = c.cart.value[0]!.uid
    expect(c.cart.value[0]!.participants).toHaveLength(2)
    c.addParticipant(uid) // 2 → 3
    expect(c.cart.value[0]!.participants).toHaveLength(3)
    c.addParticipant(uid) // at max → no-op
    expect(c.cart.value[0]!.participants).toHaveLength(3)
  })

  it('group: removeParticipant removes down to min_participants then no-ops', () => {
    // min=2, max=5; seed at 2, add one to reach 3
    const c = useCart(event(ticket({ min_participants: 2, max_participants: 5 })), [{ ticket_id: 9, quantity: 1 }])
    const uid = c.cart.value[0]!.uid
    c.addParticipant(uid) // 2 → 3
    expect(c.cart.value[0]!.participants).toHaveLength(3)
    c.removeParticipant(uid, 2) // 3 → 2
    expect(c.cart.value[0]!.participants).toHaveLength(2)
    c.removeParticipant(uid, 1) // at min → no-op
    expect(c.cart.value[0]!.participants).toHaveLength(2)
  })

  it('single ticket: seeds exactly 1 participant; addParticipant and removeParticipant are no-ops', () => {
    const c = useCart(event(ticket({ participant_type: 'single', min_participants: 1, max_participants: 1 })), [
      { ticket_id: 9, quantity: 1 },
    ])
    const uid = c.cart.value[0]!.uid
    expect(c.cart.value[0]!.participants).toHaveLength(1)
    c.addParticipant(uid)
    expect(c.cart.value[0]!.participants).toHaveLength(1)
    c.removeParticipant(uid, 0)
    expect(c.cart.value[0]!.participants).toHaveLength(1)
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

  it('drops phantom ids (stale/crafted) that match no real ticket at seed time', () => {
    const c = useCart(event(ticket({})), [
      { ticket_id: 9, quantity: 1 },
      { ticket_id: 999, quantity: 2 },
    ])
    expect(c.cart.value).toHaveLength(1)
    expect(c.cart.value.every((i) => i.ticket_id === 9)).toBe(true)
    expect(c.quantityOf(999)).toBe(0)
  })
})
