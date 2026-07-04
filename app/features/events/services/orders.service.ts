// Public orders API surface — endpoint calls only, no reactivity/UI. Returns typed DTOs.
import { useApiClient } from '#core/api'
import type {
  AttendeeSubmission,
  PaymentStatusResponse,
  PublicOrder,
  PublicOrderRegisterResponse,
  RegisterPayload,
} from '../types'

export const ordersService = {
  // Orders are addressed by public_id (a random UUID) — order_number stays as a
  // human-readable display reference only, never used to address a route/endpoint.
  getOrder: (publicId: string): Promise<PublicOrder> =>
    useApiClient()
      .get<{ data: PublicOrder }>(`/orders/${publicId}`)
      .then((r) => r.data),

  // PaymentInitiationResource is a JsonResource, so the response is wrapped under `data`.
  initiatePayment: (publicId: string, redirectUrl: string): Promise<{ redirect_url?: string }> =>
    useApiClient()
      .post<{ data: { redirect_url?: string } }>(`/orders/${publicId}/pay`, { redirect_url: redirectUrl })
      .then((r) => r.data),

  // The payment-status endpoint returns a raw JsonResponse (not a JsonResource),
  // so there is no wrapping `data` key — return the response directly.
  paymentStatus: (publicId: string): Promise<PaymentStatusResponse> =>
    useApiClient().get<PaymentStatusResponse>(`/orders/${publicId}/payment-status`),

  registerOrder: (slug: string, payload: RegisterPayload): Promise<PublicOrderRegisterResponse> =>
    useApiClient()
      .post<{ data: PublicOrderRegisterResponse }>(`/events/public/${slug}/register`, payload)
      .then((r) => r.data),

  submitAttendees: (publicId: string, participants: AttendeeSubmission[]): Promise<PublicOrder> =>
    useApiClient()
      .post<{ data: PublicOrder }>(`/orders/${publicId}/attendees`, { participants })
      .then((r) => r.data),

  cancelOrder: (publicId: string): Promise<PublicOrder> =>
    useApiClient()
      .post<{ data: PublicOrder }>(`/orders/${publicId}/cancel`)
      .then((r) => r.data),

  resendLink: (publicId: string): Promise<{ message: string }> =>
    useApiClient().post<{ message: string }>(`/orders/${publicId}/resend-link`),
}
