// Public events API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { EventOrderResponse, OrderCalculation, PublicEvent, PublicEventListItem, RegisterPayload } from '../types'

export const eventsService = {
  // Every published, listed event (past + future) — the /events browser splits client-side.
  listAll: (): Promise<PublicEventListItem[]> =>
    useApiClient()
      .get<{ data: PublicEventListItem[] }>('/events/public')
      .then((r) => r.data),

  getPublicEvent: (slug: string): Promise<PublicEvent> =>
    useApiClient()
      .get<{ data: PublicEvent }>(`/events/public/${slug}`)
      .then((r) => r.data),

  registerOrder: (slug: string, payload: RegisterPayload): Promise<EventOrderResponse> =>
    useApiClient()
      .post<{ data: EventOrderResponse }>(`/events/public/${slug}/register`, payload)
      .then((r) => r.data),

  calculateOrder: (slug: string, payload: Pick<RegisterPayload, 'tickets' | 'checkout'>): Promise<OrderCalculation> =>
    useApiClient()
      .post<{ data: OrderCalculation }>(`/events/public/${slug}/calculate`, payload)
      .then((r) => r.data),
}
