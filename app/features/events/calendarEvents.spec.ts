import { describe, expect, it } from 'vitest'
import { toCalendarEvents } from './calendarEvents'
import type { PublicEventListItem } from './types'

const ev = (over: Partial<PublicEventListItem>): PublicEventListItem => ({
  id: 1,
  slug: 'fun-run',
  title: 'Fun Run',
  description: null,
  starts_at: '2026-09-12T06:00:00Z',
  ends_at: null,
  timezone: null,
  location: null,
  currency: 'USD',
  cover: null,
  tickets: [],
  ...over,
})

describe('toCalendarEvents', () => {
  it('maps an event to a FullCalendar event with its public url', () => {
    expect(toCalendarEvents([ev({})])).toEqual([
      { title: 'Fun Run', start: '2026-09-12T06:00:00Z', end: undefined, url: '/e/fun-run' },
    ])
  })

  it('carries ends_at through as end when present', () => {
    expect(toCalendarEvents([ev({ ends_at: '2026-09-12T10:00:00Z' })])[0]?.end).toBe('2026-09-12T10:00:00Z')
  })
})
