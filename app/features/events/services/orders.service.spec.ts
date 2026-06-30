import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
vi.mock('#core/api', () => ({ useApiClient: () => ({ get, post }) }))

import { ordersService } from './orders.service'

describe('ordersService', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('getOrder fetches + unwraps', async () => {
    get.mockResolvedValue({ data: { order_number: 'A1' } })
    expect(await ordersService.getOrder('A1')).toEqual({ order_number: 'A1' })
    expect(get).toHaveBeenCalledWith('/orders/A1')
  })

  it('initiatePayment posts the redirect url', async () => {
    post.mockResolvedValue({ data: { redirect_url: 'https://pay/x' } })
    const r = await ordersService.initiatePayment('A1', 'https://app/orders/A1')
    expect(post).toHaveBeenCalledWith('/orders/A1/pay', { redirect_url: 'https://app/orders/A1' })
    expect(r.redirect_url).toBe('https://pay/x')
  })

  it('paymentStatus fetches the status (no data wrapper — raw JsonResponse)', async () => {
    // The payment-status endpoint returns a raw JsonResponse, not a JsonResource,
    // so there is no wrapping `data` key. The status field is `status`, not `payment_status`.
    get.mockResolvedValue({ success: true, status: 'paid' })
    const r = await ordersService.paymentStatus('A1')
    expect(r.status).toBe('paid')
    expect(get).toHaveBeenCalledWith('/orders/A1/payment-status')
  })

  it('registerOrder posts the cart and returns the order number', async () => {
    post.mockResolvedValue({ data: { order_number: 'A1B2' } })
    const r = await ordersService.registerOrder('spring-fair', { tickets: [], checkout: {}, buyer: { email: 'a@b.com', name: 'A' } })
    expect(post).toHaveBeenCalledWith('/events/public/spring-fair/register', expect.any(Object))
    expect(r.order_number).toBe('A1B2')
  })
})
