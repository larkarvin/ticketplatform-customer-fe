// Public events API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { EventOrderResponse, PublicEvent, RegisterPayload } from '../types'

export const eventsService = {
  getPublicEvent: (slug: string): Promise<PublicEvent> =>
    useApiClient()
      .get<{ data: PublicEvent }>(`/events/public/${slug}`)
      .then((r) => r.data),

  registerOrder: (slug: string, payload: RegisterPayload): Promise<EventOrderResponse> =>
    useApiClient()
      .post<{ data: EventOrderResponse }>(`/events/public/${slug}/register`, payload)
      .then((r) => r.data),
}
