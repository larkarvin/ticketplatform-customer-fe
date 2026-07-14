// Guest-recovery API contract types. Mirrors ../../../../api/docs/features/guest-recovery.md —
// four public endpoints that are deliberately enumeration-neutral: a known and an unknown address
// get the same status, the same body and the same shape, every time. Nothing here may be shaped in
// a way that lets the UI claim it knows which of the two happened.

/** One row of a recovered list — an order or a standalone form submission, already flattened by the API. */
export interface RecoveryItem {
  type: 'order' | 'submission'
  title: string
  /** The order number. Empty string for submissions — they carry no human reference. */
  reference: string
  status: string
  /** A ready-to-follow link that authorizes itself (signed pay URL / submission edit slug). */
  url: string
  /** Nullable on the wire (`RecoveryItemResource::createdAt?->toIso8601String()`) — do not format blindly. */
  created_at: string | null
}

/** 200 from POST /recovery/verify — the 6-digit code exchanged for a 30-minute listing token. */
export interface RecoveryVerifyResponse {
  token: string
  expires_at: string
}

/**
 * 410 from GET /recovery/items — the link is genuinely ours but past its 30 minutes. The API still
 * names the address (masked) so we can offer a one-tap resend instead of making the guest retype it.
 * A tampered token answers 422 with no address at all.
 */
export interface RecoveryExpiredResponse {
  message: string
  masked_email: string
}

/**
 * The flat neutral acknowledgement POST /recovery/request and POST /recovery/resend both return.
 * Its `message` is NOT for display: `resend` answers "A fresh link is on its way." even when three
 * codes have been burnt and it sent nothing at all. Showing it would promise a delivery we cannot
 * know happened.
 */
export interface RecoveryAckResponse {
  message: string
}
