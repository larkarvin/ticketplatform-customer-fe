// customer-fe/app/features/events/components/EventBanner.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicEvent } from '../types'
import EventBanner from './EventBanner.vue'

function event(p: Partial<PublicEvent> = {}): PublicEvent {
  return {
    id: 1,
    series_id: null,
    type: null,
    title: 'Spring Gala',
    slug: 'spring-gala',
    year: 2026,
    description: null,
    details: null,
    location: null,
    location_details: null,
    starts_at: '2026-04-05T23:00:00Z',
    ends_at: null,
    timezone: 'America/New_York',
    currency: 'USD',
    is_featured: false,
    visibility: 'public',
    cover: null,
    has_capacity: false,
    available_capacity: null,
    tickets: [],
    form_fields: null,
    ...p,
  }
}

describe('EventBanner', () => {
  it('renders the cover image when present', () => {
    const w = mount(EventBanner, { props: { event: event({ cover: { id: 1, url: 'https://x/c.jpg' } }) } })
    expect(w.find('img').attributes('src')).toBe('https://x/c.jpg')
  })

  it('renders a fallback (no img) when there is no cover', () => {
    const w = mount(EventBanner, { props: { event: event() } })
    expect(w.find('img').exists()).toBe(false)
  })
})
