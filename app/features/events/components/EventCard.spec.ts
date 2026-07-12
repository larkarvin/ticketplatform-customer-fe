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
      { price: 50, price_formatted: 'USD 50.00' },
      { price: 20, price_formatted: 'USD 20.00' },
    ],
    ...p,
  }
}

const stubs = { NuxtLink: { template: '<a :to="to"><slot /></a>', props: ['to'] } }

describe('EventCard', () => {
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
})
