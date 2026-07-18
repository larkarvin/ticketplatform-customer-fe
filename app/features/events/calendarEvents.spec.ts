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

  it('converts start/end to the event-local wall-clock time when a timezone is set', () => {
    // Manila is a fixed UTC+8 with no DST, so this is deterministic on any machine.
    const mapped = toCalendarEvents([
      ev({ timezone: 'Asia/Manila', starts_at: '2026-09-11T22:00:00Z', ends_at: '2026-09-12T00:00:00Z' }),
    ])[0]
    expect(mapped?.start).toBe('2026-09-12T06:00:00')
    expect(mapped?.end).toBe('2026-09-12T08:00:00')
  })

  it('falls back to the raw ISO string (no throw) when the timezone is unrecognized', () => {
    const mapped = toCalendarEvents([ev({ timezone: 'Not/AZone', starts_at: '2026-09-12T06:00:00Z' })])[0]
    expect(mapped?.start).toBe('2026-09-12T06:00:00Z')
  })
})
