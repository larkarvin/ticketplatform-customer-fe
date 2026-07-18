// Owns the public-events SSR fetch (home + /events browser). No transport (service) or UI here.
import { computed } from 'vue'
import { splitPublicEvents } from '~/features/events/eventBrowsing'
import { eventsService } from '~/features/events/services/events.service'
import type { PublicEventListItem } from '~/features/events/types'

// Deliberate trade-off: home ('upcoming') and the /events browser ('all') do NOT share a cache key,
// so navigating between them re-fetches. That's the right call here — home is the highest-traffic
// page on the site and must keep its SSR payload bounded to only upcoming events (server-filtered),
// while the /events browser needs the full past+future set to build its list/calendar split. Sharing
// one cache key would force a choice between an unbounded home payload and an under-fetching browser.
export function usePublicEvents(scope: 'upcoming' | 'all' = 'all') {
  if (scope === 'upcoming') {
    const { data, pending, error, refresh } = useAsyncData<PublicEventListItem[]>('public-events', () =>
      eventsService.list()
    )
    const upcoming = computed(() => data.value ?? [])
    const past = computed<PublicEventListItem[]>(() => [])
    return { events: upcoming, upcoming, past, pending, error, refresh }
  }

  const { data, pending, error, refresh } = useAsyncData<PublicEventListItem[]>('public-events-all', () =>
    eventsService.listAll()
  )

  const split = computed(() => splitPublicEvents(data.value ?? [], new Date()))
  const upcoming = computed(() => split.value.upcoming)
  const past = computed(() => split.value.past)

  // `events` stays the upcoming list — the home page rendered only upcoming before this
  // composable fetched everything, and its contract must not change.
  return { events: upcoming, upcoming, past, pending, error, refresh }
}
