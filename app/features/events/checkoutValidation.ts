// app/features/events/checkoutValidation.ts
// Pure required-field check over attendees only. Order-level add-ons (the "Optional extras" section)
// are always optional and never gate progress, so they are deliberately NOT validated here. Backend
// stays authoritative; this only avoids an obvious round-trip and drives the inline error display.
// Error keys match exactly what the UI consumes: `${uid}.${index}.${field_key}` (participants).
import { validateField } from '#core/field-engine/validation'
import type { CartTicket, PublicEvent } from '~/features/events/types'

export function validateCheckout(event: PublicEvent, cart: CartTicket[]): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const inst of cart) {
    const ticket = event.tickets.find((t) => t.id === inst.ticket_id)
    if (!ticket || ticket.collect_details_later) continue
    const fields = ticket.participant_fields ?? []
    inst.participants.forEach((p, i) => {
      for (const f of fields) {
        const msg = validateField(f, p.field_data[f.field_key])
        if (msg) errors[`${inst.uid}.${i}.${f.field_key}`] = msg
      }
    })
  }

  return errors
}
