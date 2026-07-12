import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicEvent } from '../types'
import { buildCheckoutTitle, useCheckoutSeo } from './useCheckoutSeo'

const event = { title: 'Spring Gala' } as unknown as PublicEvent

describe('buildCheckoutTitle', () => {
  it('prefixes the event title', () => {
    expect(buildCheckoutTitle(event, 'fallback')).toBe('Checkout — Spring Gala')
  })

  it('falls back when the event is not yet available', () => {
    expect(buildCheckoutTitle(null, 'fallback')).toBe('fallback')
    expect(buildCheckoutTitle(undefined, 'fallback')).toBe('fallback')
  })
})

describe('useCheckoutSeo', () => {
  // Stub the Nuxt auto-import the composable relies on (runs outside a Nuxt app here).
  const useSeoMeta = vi.fn()
  beforeEach(() => {
    useSeoMeta.mockReset()
    vi.stubGlobal('useSeoMeta', useSeoMeta)
  })

  it('sets a checkout-specific title and always noindexes the page', () => {
    useCheckoutSeo(event, 'fallback')
    expect(useSeoMeta).toHaveBeenCalledWith({
      title: 'Checkout — Spring Gala',
      robots: 'noindex, nofollow',
    })
  })
})
