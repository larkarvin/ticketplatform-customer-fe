import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePublicCheckout } from './usePublicCheckout'
const { registerOrder, initiatePayment } = vi.hoisted(() => ({ registerOrder: vi.fn(), initiatePayment: vi.fn() }))
vi.mock('~/features/events/services/events.service', () => ({ eventsService: { registerOrder } }))
vi.mock('~/features/events/services/orders.service', () => ({ ordersService: { initiatePayment } }))
const navigateTo = vi.fn()
beforeEach(() => {
  registerOrder.mockReset()
  initiatePayment.mockReset()
  navigateTo.mockReset()
  vi.stubGlobal('navigateTo', navigateTo)
})

function event() {
  return {
    slug: 'gala',
    currency: 'PHP',
    tickets: [
      {
        id: 1,
        name: 'GA',
        price: 100,
        price_formatted: '₱100',
        is_early_bird: false,
        early_bird_price_formatted: null,
      },
    ],
  } as never
}

describe('usePublicCheckout', () => {
  it('builds the payload (one participant per admit) and submits', async () => {
    registerOrder.mockResolvedValue({
      order_number: 'A1',
      requires_payment: false,
      payment_total: 200,
      currency: 'PHP',
    })
    const c = usePublicCheckout(event(), [{ ticket_id: 1, quantity: 2 }])
    c.buyer.email = 'b@e.co'
    await c.pay()
    expect(registerOrder).toHaveBeenCalledWith(
      'gala',
      expect.objectContaining({
        buyer: { email: 'b@e.co', name: '', phone: '' },
        tickets: [
          expect.objectContaining({
            ticket_id: 1,
            quantity: 2,
            participants: [{ field_data: {} }, { field_data: {} }],
          }),
        ],
        checkout: {},
      })
    )
    expect(navigateTo).toHaveBeenCalledWith('/orders/A1') // free order → straight to the order page
  })

  it('redirects to the gateway for a paid order', async () => {
    registerOrder.mockResolvedValue({ order_number: 'A1', requires_payment: true, payment_total: 200, currency: 'PHP' })
    initiatePayment.mockResolvedValue({ redirect_url: 'https://pay/x' })
    const loc = { href: '' }
    vi.stubGlobal('window', { location: loc, origin: 'https://app' } as never)
    const c = usePublicCheckout(event(), [{ ticket_id: 1, quantity: 1 }])
    c.buyer.email = 'b@e.co'
    await c.pay()
    expect(initiatePayment).toHaveBeenCalledWith('A1', 'https://app/orders/A1')
    expect(loc.href).toBe('https://pay/x')
  })
})
