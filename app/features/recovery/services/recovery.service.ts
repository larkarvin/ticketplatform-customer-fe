// Guest-recovery API surface — endpoint calls only, no reactivity/UI. The organization is carried by
// the X-Organization-Subdomain header the client injects; it is never part of these payloads.
import { useApiClient } from '#core/api'
import type { RecoveryAckResponse, RecoveryItem, RecoveryVerifyResponse } from '../types'

export const recoveryService = {
  /** Always resolves with the same neutral acknowledgement — a known and an unknown address are identical here. */
  request: (email: string): Promise<RecoveryAckResponse> =>
    useApiClient().post<RecoveryAckResponse>('/recovery/request', { email }),

  verify: (email: string, code: string): Promise<RecoveryVerifyResponse> =>
    useApiClient().post<RecoveryVerifyResponse>('/recovery/verify', { email, code }),

  // RecoveryItemResource is a JsonResource collection, so the rows arrive under `data`.
  items: (token: string): Promise<RecoveryItem[]> =>
    useApiClient()
      .get<{ data: RecoveryItem[] }>('/recovery/items', { query: { token } })
      .then((r) => r.data),

  /** Neutral like `request`: a 200 here does not mean an email was actually sent. */
  resend: (token: string): Promise<RecoveryAckResponse> =>
    useApiClient().post<RecoveryAckResponse>('/recovery/resend', { token }),
}
