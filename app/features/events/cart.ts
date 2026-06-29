// Pure helpers for checkout cart — extracted so they can be unit-tested without mounting the SSR page.
import type { CartTicket, CheckoutSelection } from './types'

/**
 * Parse the `?tickets=id:qty,id:qty` query string into a CheckoutSelection array.
 * Drops entries with non-positive or non-finite ticket IDs or quantities.
 */
export function parseSelection(query: string | (string | null)[] | null | undefined): CheckoutSelection[] {
  const raw = Array.isArray(query) ? query[0] : query
  if (!raw) return []
  return raw
    .split(',')
    .filter(Boolean)
    .map((p) => {
      const [id, q] = p.split(':')
      return { ticket_id: Number(id), quantity: Number(q) }
    })
    .filter((s) => Number.isFinite(s.ticket_id) && Number.isFinite(s.quantity) && s.ticket_id > 0 && s.quantity > 0)
}

/**
 * Canonical, order-independent key for a cart's ticket selection (counts per ticket id),
 * e.g. tickets [7, 7, 9] → "7:2,9:1". Used to decide whether a saved draft matches the
 * current URL selection — so an explicit new selection is never clobbered by a stale draft.
 */
export function selectionKey(tickets: CartTicket[]): string {
  const counts = new Map<number, number>()
  for (const t of tickets) counts.set(t.ticket_id, (counts.get(t.ticket_id) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, n]) => `${id}:${n}`)
    .join(',')
}

/**
 * Return true if the cart instance identified by `uid` has any participant
 * whose `field_data` contains at least one non-empty, non-null value.
 */
export function hasData(cart: CartTicket[], uid: string): boolean {
  const inst = cart.find((i) => i.uid === uid)
  return !!inst?.participants.some((p) => Object.values(p.field_data).some((v) => v !== '' && v != null))
}
