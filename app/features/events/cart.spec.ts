// customer-fe/app/features/events/cart.spec.ts
import { describe, expect, it } from 'vitest'
import { hasData, parseSelection, selectionKey } from './cart'
import type { CartTicket } from './types'

const inst = (ticket_id: number, uid: string): CartTicket => ({ uid, ticket_id, participants: [] })

describe('selectionKey', () => {
  it('counts instances per ticket id, order-independent', () => {
    expect(selectionKey([inst(7, '7-1'), inst(9, '9-1'), inst(7, '7-2')])).toBe('7:2,9:1')
    expect(selectionKey([inst(9, '9-1'), inst(7, '7-2'), inst(7, '7-1')])).toBe('7:2,9:1')
  })

  it('is empty string for an empty cart and differs from a non-empty one', () => {
    expect(selectionKey([])).toBe('')
    expect(selectionKey([inst(7, '7-1')])).not.toBe(selectionKey([]))
  })
})

describe('parseSelection', () => {
  it('parses a valid "id:qty,id:qty" string', () => {
    const result = parseSelection('9:2,3:1')
    expect(result).toEqual([
      { ticket_id: 9, quantity: 2 },
      { ticket_id: 3, quantity: 1 },
    ])
  })

  it('drops entries with zero quantity', () => {
    const result = parseSelection('9:0,3:1')
    expect(result).toEqual([{ ticket_id: 3, quantity: 1 }])
  })

  it('drops entries with negative quantity', () => {
    const result = parseSelection('9:-1,3:2')
    expect(result).toEqual([{ ticket_id: 3, quantity: 2 }])
  })

  it('drops non-numeric entries', () => {
    const result = parseSelection('abc:foo,3:1')
    expect(result).toEqual([{ ticket_id: 3, quantity: 1 }])
  })

  it('returns empty array for empty string', () => {
    expect(parseSelection('')).toEqual([])
  })

  it('returns empty array for null/undefined', () => {
    expect(parseSelection(null)).toEqual([])
    expect(parseSelection(undefined)).toEqual([])
  })

  it('handles array input by using the first element', () => {
    const result = parseSelection(['9:2,3:1', null])
    expect(result).toEqual([
      { ticket_id: 9, quantity: 2 },
      { ticket_id: 3, quantity: 1 },
    ])
  })
})

describe('hasData', () => {
  it('returns false for an instance with no entered fields', () => {
    const cart: CartTicket[] = [{ uid: '9-1', ticket_id: 9, participants: [{ field_data: {} }] }]
    expect(hasData(cart, '9-1')).toBe(false)
  })

  it('returns false for an instance with empty string fields', () => {
    const cart: CartTicket[] = [{ uid: '9-1', ticket_id: 9, participants: [{ field_data: { name: '', email: '' } }] }]
    expect(hasData(cart, '9-1')).toBe(false)
  })

  it('returns true once a participant field is filled', () => {
    const cart: CartTicket[] = [{ uid: '9-1', ticket_id: 9, participants: [{ field_data: { name: 'Maria' } }] }]
    expect(hasData(cart, '9-1')).toBe(true)
  })

  it('returns true when any participant in a multi-participant ticket has data', () => {
    const cart: CartTicket[] = [
      {
        uid: '9-1',
        ticket_id: 9,
        participants: [{ field_data: {} }, { field_data: { name: 'Jose' } }],
      },
    ]
    expect(hasData(cart, '9-1')).toBe(true)
  })

  it('returns false when the uid is not found in the cart', () => {
    const cart: CartTicket[] = [{ uid: '9-1', ticket_id: 9, participants: [{ field_data: { name: 'Maria' } }] }]
    expect(hasData(cart, 'not-found')).toBe(false)
  })
})
