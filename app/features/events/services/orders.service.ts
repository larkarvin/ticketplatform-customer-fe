// Public orders API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type { PaymentStatusResponse, PublicOrder } from '../types'

export const ordersService = {
  getOrder: (orderNumber: string): Promise<PublicOrder> =>
    useApiClient()
      .get<{ data: PublicOrder }>(`/orders/${orderNumber}`)
      .then((r) => r.data),

  // PaymentInitiationResource is a JsonResource, so the response is wrapped under `data`.
  initiatePayment: (orderNumber: string, redirectUrl: string): Promise<{ redirect_url: string }> =>
    useApiClient()
      .post<{ data: { redirect_url: string } }>(`/orders/${orderNumber}/pay`, { redirect_url: redirectUrl })
      .then((r) => r.data),

  // The payment-status endpoint returns a raw JsonResponse (not a JsonResource),
  // so there is no wrapping `data` key — return the response directly.
  paymentStatus: (orderNumber: string): Promise<PaymentStatusResponse> =>
    useApiClient().get<PaymentStatusResponse>(`/orders/${orderNumber}/payment-status`),
}
