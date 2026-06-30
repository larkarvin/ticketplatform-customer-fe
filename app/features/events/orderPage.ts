/**
 * Pure helpers for the order page — kept outside the .vue component so they are
 * unit-testable without mounting the page.
 */

import type { PublicOrder } from './types'

/**
 * Formats a seconds countdown as mm:ss.
 * Returns '' for null or negative values.
 */
export function formatCountdown(seconds: number | null): string {
  if (seconds === null || seconds < 0) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Choose the status to seed `useOrderStatus` with on the order page.
 *
 * Returning from a successful gateway redirect, the order is still `pending` on the server
 * until the first poll confirms. Seeding the UI from that raw `pending` would flash the
 * "reserved / Resume payment" state with a live countdown — inviting a double payment. So
 * when the return URL carries `?status=success` and the order isn't already `paid`, seed
 * `processing` ("Confirming your payment…") until the first poll resolves.
 *
 * The normal (no `?status`) path is untouched: it returns the order's own payment_status.
 */
export function seedStatus(paymentStatus: string, returnStatus: string | undefined): string {
  if (returnStatus === 'success' && paymentStatus !== 'paid') return 'processing'
  return paymentStatus
}

/**
 * Build a `?tickets=` query string from an existing order's ticket lines so the buyer can
 * restart checkout with the same ticket selection pre-filled.
 *
 * The URL `?tickets=` selection is the authoritative cart channel (the checkout page parses
 * it via `parseSelection` into `id:qty,id:qty` pairs and seeds the cart — including the
 * per-instance `min_participants`). Returning the order to checkout through this channel,
 * rather than a persisted draft, is what makes the rebuild land on a populated cart.
 *
 * Returns null when:
 * - `order.event_slug` is null (no event context → no checkout URL to navigate to)
 * - the order has no ticket lines (nothing to re-seed)
 */
export function buildTicketsQuery(order: PublicOrder): string | null {
  if (order.event_slug === null) return null

  const ticketLines = order.items.filter((item) => item.ticket_id !== null)
  if (ticketLines.length === 0) return null

  // Format must match `parseSelection` in cart.ts: comma-joined `${ticket_id}:${quantity}`.
  return ticketLines.map((line) => `${line.ticket_id}:${line.quantity}`).join(',')
}
