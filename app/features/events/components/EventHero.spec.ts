// customer-fe/app/features/events/components/EventHero.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicEvent } from '../types'
import EventHero from './EventHero.vue'

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
    location: 'Parish Hall',
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

describe('EventHero', () => {
  it('renders title, date and location', () => {
    const w = mount(EventHero, { props: { event: event() } })
    expect(w.text()).toContain('Spring Gala')
    expect(w.text()).toContain('April 5, 2026')
    expect(w.text()).toContain('Parish Hall')
  })
})
