import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
vi.mock('#core/api', () => ({ useApiClient: () => ({ get, post }) }))

import { eventsService } from './events.service'

describe('eventsService', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('getPublicEvent unwraps the data envelope', async () => {
    get.mockResolvedValue({ data: { id: 1, slug: 'gala', title: 'Gala', tickets: [] } })
    const event = await eventsService.getPublicEvent('gala')
    expect(get).toHaveBeenCalledWith('/events/public/gala')
    expect(event).toEqual({ id: 1, slug: 'gala', title: 'Gala', tickets: [] })
  })

  it('registerOrder posts the payload + unwraps', async () => {
    post.mockResolvedValue({
      data: { order_number: 'A1', requires_payment: true, payment_total: 200, currency: 'PHP' },
    })
    const r = await eventsService.registerOrder('gala', {
      buyer: { email: 'b@e.co' },
      tickets: [],
      checkout: {},
    })
    expect(post).toHaveBeenCalledWith('/events/public/gala/register', {
      buyer: { email: 'b@e.co' },
      tickets: [],
      checkout: {},
    })
    expect(r.order_number).toBe('A1')
  })
})
