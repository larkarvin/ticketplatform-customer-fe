import { describe, expect, it } from 'vitest'
import type { PublicEvent } from '../types'
import { buildEventJsonLd } from './useEventSeo'

const event = {
  slug: 'spring-gala',
  title: 'Spring Gala',
  description: 'A night out',
  starts_at: '2026-09-01T18:00:00+08:00',
  ends_at: '2026-09-01T22:00:00+08:00',
  location: 'Grand Hall',
  location_details: null,
  currency: 'PHP',
  cover: { url: 'https://cdn/x.jpg' },
  visibility: 'public',
  tickets: [{ price: 500 }, { price: 1500 }],
} as unknown as PublicEvent

describe('buildEventJsonLd', () => {
  it('produces a schema.org Event with offers from the ticket price range', () => {
    const ld = buildEventJsonLd(event, { siteUrl: 'https://tix.test', orgName: 'Acme', imageUrl: 'https://cdn/x.jpg' })
    expect(ld['@type']).toBe('Event')
    expect(ld.name).toBe('Spring Gala')
    expect(ld.startDate).toBe('2026-09-01T18:00:00+08:00')
    expect(ld.url).toBe('https://tix.test/e/spring-gala')
    expect(ld.offers).toMatchObject({ '@type': 'AggregateOffer', lowPrice: 500, highPrice: 1500, priceCurrency: 'PHP' })
    expect(ld.image).toBe('https://cdn/x.jpg')
  })
})
