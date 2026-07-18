import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const { listAll } = vi.hoisted(() => ({ listAll: vi.fn() }))
vi.mock('~/features/events/services/events.service', () => ({
  eventsService: { listAll },
}))

// Stub the Nuxt auto-import the composable relies on (runs outside a Nuxt app here).
beforeEach(() => {
  listAll.mockReset()
  vi.stubGlobal('useAsyncData', (_key: string, handler: () => Promise<unknown>) => {
    const data = ref<unknown>(null)
    const pending = ref(true)
    const error = ref<unknown>(null)
    const promise = Promise.resolve()
      .then(handler)
      .then((d) => {
        data.value = d
      })
      .catch((e) => {
        error.value = e
      })
      .finally(() => {
        pending.value = false
      })
    return Object.assign(promise, { data, pending, error })
  })
})

import { usePublicEvents } from './usePublicEvents'

describe('usePublicEvents', () => {
  it('unwraps the resolved list', async () => {
    const gala = { id: 1, slug: 'gala', title: 'Gala', tickets: [], starts_at: '2999-01-01T00:00:00Z', ends_at: null }
    listAll.mockResolvedValue([gala])
    const { events } = usePublicEvents()
    await new Promise((r) => setTimeout(r, 0))
    expect(events.value).toEqual([gala])
  })

  it('defaults to an empty array before/without data', async () => {
    listAll.mockResolvedValue(undefined as unknown as [])
    const { events } = usePublicEvents()
    await new Promise((r) => setTimeout(r, 0))
    expect(events.value).toEqual([])
  })

  it('exposes upcoming (asc) and past (desc), with events aliasing upcoming', async () => {
    listAll.mockResolvedValue([
      { id: 1, slug: 'past-event', title: 'Past Event', tickets: [], starts_at: '2020-01-01T00:00:00Z', ends_at: null },
      {
        id: 2,
        slug: 'future-event',
        title: 'Future Event',
        tickets: [],
        starts_at: '2999-01-01T00:00:00Z',
        ends_at: null,
      },
    ])
    const { events, upcoming, past } = usePublicEvents()
    await new Promise((r) => setTimeout(r, 0))
    expect(upcoming.value.map((e) => e.id)).toEqual([2])
    expect(past.value.map((e) => e.id)).toEqual([1])
    expect(events.value).toEqual(upcoming.value)
  })
})
