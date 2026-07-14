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
  tickets: [
    { price: 500, is_early_bird: false, early_bird_price: null },
    { price: 1500, is_early_bird: false, early_bird_price: null },
  ],
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

  it('omits the image key when there is no cover or org logo', () => {
    const ld = buildEventJsonLd(event, { siteUrl: 'https://tix.test', orgName: 'Acme', imageUrl: '' })
    expect(ld).not.toHaveProperty('image')
  })

  it('uses the early-bird price in the offer range while the window is open', () => {
    const earlyBird = {
      ...event,
      tickets: [
        { price: 500, is_early_bird: false, early_bird_price: null },
        { price: 1500, is_early_bird: true, early_bird_price: 300 },
      ],
    } as unknown as PublicEvent
    const ld = buildEventJsonLd(earlyBird, {
      siteUrl: 'https://tix.test',
      orgName: 'Acme',
      imageUrl: 'https://cdn/x.jpg',
    })
    // The 1500 ticket costs 300 on early bird, so it — not the 500 one — is the cheapest a buyer can pay.
    expect(ld.offers).toMatchObject({ lowPrice: 300, highPrice: 500 })
  })
})
