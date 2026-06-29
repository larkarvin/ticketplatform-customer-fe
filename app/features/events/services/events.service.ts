// Public events API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { PublicEvent } from '../types'

export const eventsService = {
  getPublicEvent: (slug: string): Promise<PublicEvent> =>
    useApiClient()
      .get<{ data: PublicEvent }>(`/events/public/${slug}`)
      .then((r) => r.data),
}
