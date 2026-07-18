// Pure upcoming/past split for the public /events browser (SSR-safe, no Vue).
// An event that has started but not yet ended still counts as upcoming.
import type { PublicEventListItem } from './types'

export function splitPublicEvents(
  events: PublicEventListItem[],
  now: Date
): { upcoming: PublicEventListItem[]; past: PublicEventListItem[] } {
  const upcoming: PublicEventListItem[] = []
  const past: PublicEventListItem[] = []

  for (const event of events) {
    const horizon = new Date(event.ends_at ?? event.starts_at)
    ;(horizon >= now ? upcoming : past).push(event)
  }

  upcoming.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  past.sort((a, b) => b.starts_at.localeCompare(a.starts_at))
  return { upcoming, past }
}
