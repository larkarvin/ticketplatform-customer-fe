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

  it('list requests upcoming public events + unwraps the data envelope', async () => {
    get.mockResolvedValue({ data: [{ id: 1, slug: 'gala', title: 'Gala', tickets: [] }] })
    const events = await eventsService.list()
    expect(get).toHaveBeenCalledWith('/events/public', { query: { 'filter[upcoming]': 1 } })
    expect(events).toEqual([{ id: 1, slug: 'gala', title: 'Gala', tickets: [] }])
  })

  it('getPublicEvent unwraps the data envelope', async () => {
    get.mockResolvedValue({ data: { id: 1, slug: 'gala', title: 'Gala', tickets: [] } })
    const event = await eventsService.getPublicEvent('gala')
    expect(get).toHaveBeenCalledWith('/events/public/gala')
    expect(event).toEqual({ id: 1, slug: 'gala', title: 'Gala', tickets: [] })
  })

  it('registerOrder posts the payload + unwraps (public_id + display order_number)', async () => {
    post.mockResolvedValue({
      data: {
        public_id: '11111111-1111-4111-8111-111111111111',
        order_number: 'A1',
        requires_payment: true,
        payment_total: 200,
        currency: 'PHP',
      },
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
    expect(r.public_id).toBe('11111111-1111-4111-8111-111111111111')
    expect(r.order_number).toBe('A1')
  })

  it('listAll requests every public event (no upcoming filter) + unwraps the data envelope', async () => {
    get.mockResolvedValue({ data: [{ id: 1 }] })
    const events = await eventsService.listAll()
    expect(get).toHaveBeenCalledWith('/events/public')
    expect(events).toEqual([{ id: 1 }])
  })

  it('calculateOrder posts to /calculate + unwraps', async () => {
    post.mockResolvedValue({
      data: {
        currency: 'PHP',
        items: [],
        subtotal: 150,
        fees: [],
        fees_total: 0,
        taxes: [],
        taxes_total: 0,
        total: 150,
      },
    })
    const r = await eventsService.calculateOrder('gala', { tickets: [], checkout: {} })
    expect(post).toHaveBeenCalledWith('/events/public/gala/calculate', {
      tickets: [],
      checkout: {},
    })
    expect(r.total).toBe(150)
  })
})
