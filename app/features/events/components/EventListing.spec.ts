import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicEventListItem } from '../types'
import EventListing from './EventListing.vue'

const event = {
  id: 1,
  slug: 'gala',
  title: 'Spring Gala',
  starts_at: '2026-08-01T18:00:00+00:00',
  ends_at: null,
  timezone: 'UTC',
  location: 'Hall A',
  cover: null,
  tickets: [],
} as unknown as PublicEventListItem

describe('EventListing', () => {
  it('renders the heading and a card per event', () => {
    const w = mount(EventListing, { props: { events: [event], heading: 'Upcoming events' } })
    expect(w.text()).toContain('Upcoming events')
    expect(w.text()).toContain('Spring Gala')
  })
  it('shows the empty state when there are no events', () => {
    const w = mount(EventListing, { props: { events: [] } })
    expect(w.text()).toContain('No upcoming events')
  })
  it('shows an error message when error is set', () => {
    const w = mount(EventListing, { props: { events: [], error: new Error('x') } })
    expect(w.text()).toContain("Couldn't load events")
  })
})
