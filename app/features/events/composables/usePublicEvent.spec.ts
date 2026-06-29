import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const { getPublicEvent } = vi.hoisted(() => ({ getPublicEvent: vi.fn() }))
vi.mock('~/features/events/services/events.service', () => ({
  eventsService: { getPublicEvent },
}))

// Stub the Nuxt auto-imports the composable relies on (runs outside a Nuxt app here).
beforeEach(() => {
  getPublicEvent.mockReset()
  vi.stubGlobal('useAsyncData', (_key: string, handler: () => Promise<unknown>) => {
    const data = ref<unknown>(null)
    const error = ref<unknown>(null)
    const promise = Promise.resolve()
      .then(handler)
      .then((d) => {
        data.value = d
      })
      .catch((e) => {
        error.value = e
      })
    return Object.assign(promise, { data, error })
  })
  vi.stubGlobal('useSeoMeta', () => {})
  vi.stubGlobal('createError', (o: { statusMessage?: string }) => new Error(o.statusMessage ?? 'error'))
})

import { usePublicEvent } from './usePublicEvent'

describe('usePublicEvent', () => {
  it('returns the resolved event', async () => {
    getPublicEvent.mockResolvedValue({ id: 1, slug: 'gala', title: 'Gala', tickets: [] })
    const { event } = await usePublicEvent('gala')
    expect(event.title).toBe('Gala')
  })

  it('throws a 404 when the event is not found', async () => {
    getPublicEvent.mockRejectedValue(new Error('404'))
    await expect(usePublicEvent('missing')).rejects.toThrow()
  })
})
