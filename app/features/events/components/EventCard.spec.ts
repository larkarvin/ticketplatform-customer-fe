// customer-fe/app/features/events/components/EventCard.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicEventListItem } from '../types'
import EventCard from './EventCard.vue'

function event(p: Partial<PublicEventListItem> = {}): PublicEventListItem {
  return {
    id: 1,
    slug: 'spring-gala',
    title: 'Spring Gala',
    description: null,
    starts_at: '2026-04-05T23:00:00Z',
    ends_at: null,
    timezone: 'America/New_York',
    location: 'Parish Hall',
    currency: 'USD',
    cover: null,
    tickets: [
      {
        price: 50,
        price_formatted: 'USD 50.00',
        early_bird_price: null,
        early_bird_price_formatted: null,
        is_early_bird: false,
      },
      {
        price: 20,
        price_formatted: 'USD 20.00',
        early_bird_price: null,
        early_bird_price_formatted: null,
        is_early_bird: false,
      },
    ],
    ...p,
  }
}

const stubs = { NuxtLink: { template: '<a :to="to"><slot /></a>', props: ['to'] } }

describe('EventCard', () => {
  it('shows the early-bird price as the "from" price when it is the cheapest a buyer can pay', () => {
    // The 50-dollar ticket drops to 10 on early bird, undercutting the 20-dollar one. Pricing off the
    // regular price would advertise "From USD 20.00" and then charge less — and, worse, a regular
    // price that undercuts an early bird would advertise a price the buyer can never get.
    const w = mount(EventCard, {
      props: {
        event: event({
          tickets: [
            {
              price: 50,
              price_formatted: 'USD 50.00',
              early_bird_price: 10,
              early_bird_price_formatted: 'USD 10.00',
              is_early_bird: true,
            },
            {
              price: 20,
              price_formatted: 'USD 20.00',
              early_bird_price: null,
              early_bird_price_formatted: null,
              is_early_bird: false,
            },
          ],
        }),
      },
      global: { stubs },
    })
    expect(w.text()).toContain('From USD 10.00')
  })

  it('renders title, formatted date, location and the cheapest ticket price', () => {
    const w = mount(EventCard, { props: { event: event() }, global: { stubs } })
    expect(w.text()).toContain('Spring Gala')
    expect(w.text()).toContain('April 5, 2026')
    expect(w.text()).toContain('Parish Hall')
    expect(w.text()).toContain('From USD 20.00')
  })

  it('links to the event page', () => {
    const w = mount(EventCard, { props: { event: event() }, global: { stubs } })
    expect(w.find('a').attributes('to')).toBe('/e/spring-gala')
  })

  it('renders a fallback (no img) when there is no cover', () => {
    const w = mount(EventCard, { props: { event: event() }, global: { stubs } })
    expect(w.find('img').exists()).toBe(false)
  })

  it('renders the cover image when present', () => {
    const w = mount(EventCard, { props: { event: event({ cover: { url: 'https://x/c.jpg' } }) }, global: { stubs } })
    expect(w.find('img').attributes('src')).toBe('https://x/c.jpg')
  })

  it('omits the price when there are no tickets', () => {
    const w = mount(EventCard, { props: { event: event({ tickets: [] }) }, global: { stubs } })
    expect(w.text()).not.toContain('From')
  })

  it('hides the price when past is true, even with tickets', () => {
    const w = mount(EventCard, { props: { event: event(), past: true }, global: { stubs } })
    expect(w.text()).not.toContain('From')
  })

  it('mutes the fallback cover and title (not via parent opacity) when past is true', () => {
    // The past section no longer wraps this card in a parent `opacity-70` (that dims the text
    // below AA contrast). Muting must instead be self-contained: cover gets opacity+grayscale,
    // title downshifts to gray-700, meta lines stay full-opacity gray-600.
    const w = mount(EventCard, { props: { event: event(), past: true }, global: { stubs } })
    const fallback = w.find('svg').element.parentElement
    expect(fallback?.className).toContain('opacity-60')
    expect(fallback?.className).toContain('grayscale')
    const title = w.find('h2')
    expect(title.classes()).toContain('text-gray-700')
    expect(title.classes()).not.toContain('text-gray-900')
  })

  it('mutes the cover image (not via parent opacity) when past is true and a cover exists', () => {
    const w = mount(EventCard, {
      props: { event: event({ cover: { url: 'https://x/c.jpg' } }), past: true },
      global: { stubs },
    })
    const img = w.find('img')
    expect(img.classes()).toContain('opacity-60')
    expect(img.classes()).toContain('grayscale')
  })
})
