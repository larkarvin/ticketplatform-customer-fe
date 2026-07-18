// Owns the public-events SSR fetch (home + /events browser). No transport (service) or UI here.
import { computed } from 'vue'
import { splitPublicEvents } from '~/features/events/eventBrowsing'
import { eventsService } from '~/features/events/services/events.service'
import type { PublicEventListItem } from '~/features/events/types'

export function usePublicEvents() {
  const { data, pending, error } = useAsyncData<PublicEventListItem[]>('public-events', () => eventsService.listAll())

  const split = computed(() => splitPublicEvents(data.value ?? [], new Date()))
  const upcoming = computed(() => split.value.upcoming)
  const past = computed(() => split.value.past)

  // `events` stays the upcoming list — the home page rendered only upcoming before this
  // composable fetched everything, and its contract must not change.
  return { events: upcoming, upcoming, past, pending, error }
}
