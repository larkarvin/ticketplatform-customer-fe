/**
 * Pure helpers for the order page — kept outside the .vue component so they are
 * unit-testable without mounting the page.
 */

import type { CheckoutDraft } from './composables/useCheckoutPersistence'
import type { CartTicket, PublicOrder } from './types'

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
 * Build a CheckoutDraft from an existing order so the buyer can restart checkout
 * with the same ticket selection pre-loaded.
 *
 * Returns null when:
 * - `order.event_slug` is null (no event context → no checkout URL to navigate to)
 * - the order has no ticket lines (nothing to re-seed)
 *
 * Fidelity limitation: participant fields are seeded as empty (`participants: []`)
 * because the order resource does not carry the event's ticket config (min_participants,
 * participant_fields). The checkout page will re-validate and prompt for details.
 */
export function buildRebuildDraft(order: PublicOrder): CheckoutDraft | null {
  if (order.event_slug === null) return null

  const ticketLines = order.items.filter((item) => item.ticket_id !== null)
  if (ticketLines.length === 0) return null

  const tickets: CartTicket[] = []
  for (const line of ticketLines) {
    // ticket_id is non-null here (filtered above), but TypeScript needs the assertion.
    const ticketId = line.ticket_id as number
    for (let i = 0; i < line.quantity; i++) {
      tickets.push({
        uid: crypto.randomUUID(),
        ticket_id: ticketId,
        participants: [],
      })
    }
  }

  return {
    tickets,
    checkoutAnswers: {},
    email: '',
  }
}
