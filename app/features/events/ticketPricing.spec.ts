import { describe, expect, it } from 'vitest'
import { isEarlyBirdActive, ticketEffectivePrice, ticketPriceLabel, type TicketPricing } from './ticketPricing'

const ticket = (over: Partial<TicketPricing> = {}): TicketPricing => ({
  price: 1000,
  price_formatted: '1,000.00 PHP',
  early_bird_price: 800,
  early_bird_price_formatted: '800.00 PHP',
  is_early_bird: true,
  ...over,
})

describe('ticket pricing', () => {
  it('uses the early-bird price while the window is open', () => {
    expect(ticketEffectivePrice(ticket())).toBe(800)
    expect(ticketPriceLabel(ticket())).toBe('800.00 PHP')
  })

  it('falls back to the regular price once the window has closed', () => {
    const closed = ticket({ is_early_bird: false })
    expect(ticketEffectivePrice(closed)).toBe(1000)
    expect(ticketPriceLabel(closed)).toBe('1,000.00 PHP')
  })

  it('uses the regular price when no early-bird price is set', () => {
    const none = ticket({ is_early_bird: false, early_bird_price: null, early_bird_price_formatted: null })
    expect(ticketEffectivePrice(none)).toBe(1000)
    expect(ticketPriceLabel(none)).toBe('1,000.00 PHP')
  })

  // A payload that flags early bird without an actual early-bird price must not sort by one price and
  // display another — both helpers derive from the same predicate, so neither can be half-applied.
  it('ignores an early-bird flag with no early-bird price', () => {
    const flagged = ticket({ is_early_bird: true, early_bird_price: null, early_bird_price_formatted: null })
    expect(isEarlyBirdActive(flagged)).toBe(false)
    expect(ticketEffectivePrice(flagged)).toBe(1000)
    expect(ticketPriceLabel(flagged)).toBe('1,000.00 PHP')
  })

  it('ignores an early-bird flag with a price but no formatted label', () => {
    const half = ticket({ is_early_bird: true, early_bird_price: 800, early_bird_price_formatted: null })
    expect(ticketEffectivePrice(half)).toBe(1000)
    expect(ticketPriceLabel(half)).toBe('1,000.00 PHP')
  })

  it('handles a free ticket', () => {
    const free = ticket({
      price: 0,
      price_formatted: 'Free',
      is_early_bird: false,
      early_bird_price: null,
      early_bird_price_formatted: null,
    })
    expect(ticketEffectivePrice(free)).toBe(0)
    expect(ticketPriceLabel(free)).toBe('Free')
  })

  it('treats a zero early-bird price as a real price, not as absent', () => {
    const freeEarly = ticket({ early_bird_price: 0, early_bird_price_formatted: 'Free' })
    expect(ticketEffectivePrice(freeEarly)).toBe(0)
    expect(ticketPriceLabel(freeEarly)).toBe('Free')
  })
})
