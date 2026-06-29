import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('#core/api', () => ({ useApiClient: () => ({ get }) }))

import { eventsService } from './events.service'

describe('eventsService', () => {
  beforeEach(() => get.mockReset())

  it('getPublicEvent unwraps the data envelope', async () => {
    get.mockResolvedValue({ data: { id: 1, slug: 'gala', title: 'Gala', tickets: [] } })
    const event = await eventsService.getPublicEvent('gala')
    expect(get).toHaveBeenCalledWith('/events/public/gala')
    expect(event).toEqual({ id: 1, slug: 'gala', title: 'Gala', tickets: [] })
  })
})
