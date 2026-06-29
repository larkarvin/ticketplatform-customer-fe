// customer-fe/app/features/events/eventDate.spec.ts
import { describe, expect, it } from 'vitest'
import { formatEventDate } from './eventDate'

describe('formatEventDate', () => {
  it('formats a single start in the given timezone', () => {
    // 2026-04-05T23:00:00Z == 7:00 PM in New York (EDT)
    const out = formatEventDate('2026-04-05T23:00:00Z', null, 'America/New_York')
    expect(out).toContain('April 5, 2026')
    expect(out).toContain('7:00')
  })

  it('formats a same-day start–end as a time range', () => {
    const out = formatEventDate('2026-04-05T23:00:00Z', '2026-04-06T01:00:00Z', 'America/New_York')
    expect(out).toContain('April 5, 2026')
    expect(out).toContain('7:00')
    expect(out).toContain('9:00')
  })
})
