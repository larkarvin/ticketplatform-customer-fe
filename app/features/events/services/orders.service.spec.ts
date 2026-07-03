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

  const publicId = '11111111-1111-4111-8111-111111111111'

  it('getOrder fetches + unwraps (addressed by public_id, order_number kept for display)', async () => {
    get.mockResolvedValue({ data: { public_id: publicId, order_number: 'A1' } })
    expect(await ordersService.getOrder(publicId)).toEqual({ public_id: publicId, order_number: 'A1' })
    expect(get).toHaveBeenCalledWith(`/orders/${publicId}`)
  })

  it('initiatePayment posts the redirect url, addressed by public_id', async () => {
    post.mockResolvedValue({ data: { redirect_url: 'https://pay/x' } })
    const r = await ordersService.initiatePayment(publicId, `https://app/orders/${publicId}`)
    expect(post).toHaveBeenCalledWith(`/orders/${publicId}/pay`, { redirect_url: `https://app/orders/${publicId}` })
    expect(r.redirect_url).toBe('https://pay/x')
  })

  it('paymentStatus fetches the status (no data wrapper — raw JsonResponse), addressed by public_id', async () => {
    // The payment-status endpoint returns a raw JsonResponse, not a JsonResource,
    // so there is no wrapping `data` key. The status field is `status`, not `payment_status`.
    get.mockResolvedValue({ success: true, status: 'paid' })
    const r = await ordersService.paymentStatus(publicId)
    expect(r.status).toBe('paid')
    expect(get).toHaveBeenCalledWith(`/orders/${publicId}/payment-status`)
  })

  it('registerOrder posts the cart and returns the order (public_id + display order_number)', async () => {
    post.mockResolvedValue({ data: { public_id: publicId, order_number: 'A1B2' } })
    const r = await ordersService.registerOrder('spring-fair', {
      tickets: [],
      checkout: {},
      buyer: { email: 'a@b.com', name: 'A' },
    })
    expect(post).toHaveBeenCalledWith('/events/public/spring-fair/register', expect.any(Object))
    expect(r.public_id).toBe(publicId)
    expect(r.order_number).toBe('A1B2')
  })
})
