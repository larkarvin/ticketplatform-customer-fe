// features/events/ticketPricing.ts — what a buyer actually pays for a ticket right now.
// Mirrors the API's Ticket::effectivePrice() / isEarlyBird(): while the early-bird window is open the
// buyer pays the early-bird price, otherwise the regular price. Every price the buyer is shown must
// come from here, so what we advertise matches what the API quotes at checkout and ultimately charges.

/** The pricing fields every ticket payload carries (EventTicketResource) — the full PublicTicket on
 *  the event page and the leaner ticket shape on an event-list item both satisfy this. */
export interface TicketPricing {
  price: number
  price_formatted: string
  early_bird_price: number | null
  early_bird_price_formatted: string | null
  is_early_bird: boolean
}

/** The one early-bird predicate. Both the number and the label derive from this, so a payload that
 *  sets `is_early_bird` without a price can never sort by one price and display the other. */
export function isEarlyBirdActive(t: TicketPricing): boolean {
  return t.is_early_bird && t.early_bird_price !== null && t.early_bird_price_formatted !== null
}

/** The numeric price a buyer pays now — for comparisons (e.g. picking the cheapest ticket). */
export function ticketEffectivePrice(t: TicketPricing): number {
  return isEarlyBirdActive(t) ? t.early_bird_price! : t.price
}

/** The formatted price a buyer pays now — for display. */
export function ticketPriceLabel(t: TicketPricing): string {
  return isEarlyBirdActive(t) ? t.early_bird_price_formatted! : t.price_formatted
}
