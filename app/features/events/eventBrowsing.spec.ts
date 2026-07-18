import { describe, expect, it } from 'vitest'
import { splitPublicEvents } from './eventBrowsing'
import type { PublicEventListItem } from './types'

const ev = (id: number, starts_at: string, ends_at: string | null = null): PublicEventListItem => ({
  id,
  slug: `e${id}`,
  title: `E${id}`,
  description: null,
  starts_at,
  ends_at,
  timezone: null,
  location: null,
  currency: 'USD',
  cover: null,
  tickets: [],
})

const NOW = new Date('2026-07-18T12:00:00Z')

describe('splitPublicEvents', () => {
  it('splits future events into upcoming (soonest first) and past (newest first)', () => {
    const { upcoming, past } = splitPublicEvents(
      [
        ev(1, '2026-09-01T00:00:00Z'),
        ev(2, '2026-01-01T00:00:00Z'),
        ev(3, '2026-08-01T00:00:00Z'),
        ev(4, '2026-03-01T00:00:00Z'),
      ],
      NOW
    )
    expect(upcoming.map((e) => e.id)).toEqual([3, 1])
    expect(past.map((e) => e.id)).toEqual([4, 2])
  })

  it('counts a started-but-not-ended event as upcoming', () => {
    const { upcoming, past } = splitPublicEvents([ev(1, '2026-07-18T08:00:00Z', '2026-07-18T20:00:00Z')], NOW)
    expect(upcoming.map((e) => e.id)).toEqual([1])
    expect(past).toEqual([])
  })

  it('uses starts_at alone when ends_at is null', () => {
    const { past } = splitPublicEvents([ev(1, '2026-07-18T08:00:00Z')], NOW)
    expect(past.map((e) => e.id)).toEqual([1])
  })
})
