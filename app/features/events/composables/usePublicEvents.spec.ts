import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('~/features/events/services/events.service', () => ({
  eventsService: { list },
}))

// Stub the Nuxt auto-import the composable relies on (runs outside a Nuxt app here).
beforeEach(() => {
  list.mockReset()
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
    list.mockResolvedValue([{ id: 1, slug: 'gala', title: 'Gala', tickets: [] }])
    const { events } = usePublicEvents()
    await new Promise((r) => setTimeout(r, 0))
    expect(events.value).toEqual([{ id: 1, slug: 'gala', title: 'Gala', tickets: [] }])
  })

  it('defaults to an empty array before/without data', async () => {
    list.mockResolvedValue(undefined as unknown as [])
    const { events } = usePublicEvents()
    await new Promise((r) => setTimeout(r, 0))
    expect(events.value).toEqual([])
  })
})
