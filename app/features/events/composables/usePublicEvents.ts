// Owns the home page's SSR fetch of upcoming public events. No transport (service) or UI here.
import { computed } from 'vue'
import { eventsService } from '~/features/events/services/events.service'
import type { PublicEventListItem } from '~/features/events/types'

export function usePublicEvents() {
  const { data, pending, error } = useAsyncData<PublicEventListItem[]>('public-events', () => eventsService.list())
  return { events: computed(() => data.value ?? []), pending, error }
}
