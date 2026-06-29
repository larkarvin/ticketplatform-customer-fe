// Public events API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { EventOrderResponse, OrderCalculation, PublicEvent, RegisterPayload } from '../types'

export const eventsService = {
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
