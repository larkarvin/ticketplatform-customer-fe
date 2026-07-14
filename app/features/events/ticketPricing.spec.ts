import { describe, expect, it } from 'vitest'
import { ticketEffectivePrice, ticketPriceLabel, type TicketPricing } from './ticketPricing'

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
})
