// app/features/events/checkoutValidation.ts
// Pure required-field check over attendees only. Order-level add-ons (the "Optional extras" section)
// are always optional and never gate progress, so they are deliberately NOT validated here. Backend
// stays authoritative; this only avoids an obvious round-trip and drives the inline error display.
// Error keys match exactly what the UI consumes: `${uid}.${index}.${field_key}` (participants).
import type { Field } from '#core/field-engine/types'
import { validateField } from '#core/field-engine/validation'
import type { CartParticipant, CartTicket, PublicEvent } from '~/features/events/types'

/** Per-participant errors keyed by field_key. The single source of truth for "is this person done":
 *  the on-submit gate, the group badge, and the per-card status pill all derive from this, so a green
 *  "complete" means exactly "passes validation" (format included), never just "non-empty". */
export function participantFieldErrors(fields: Field[], participant: CartParticipant): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    const msg = validateField(f, participant.field_data[f.field_key])
    if (msg) errors[f.field_key] = msg
  }
  return errors
}

/** Count of fields still needing a valid answer for one participant. */
export function participantMissingCount(fields: Field[], participant: CartParticipant): number {
  return Object.keys(participantFieldErrors(fields, participant)).length
}

/** True when every field of a participant passes validation. */
export function isParticipantComplete(fields: Field[], participant: CartParticipant): boolean {
  return participantMissingCount(fields, participant) === 0
}

export function validateCheckout(event: PublicEvent, cart: CartTicket[]): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const inst of cart) {
    const ticket = event.tickets.find((t) => t.id === inst.ticket_id)
    if (!ticket || ticket.collect_details_later) continue
    const fields = ticket.participant_fields ?? []
    inst.participants.forEach((p, i) => {
      for (const [key, msg] of Object.entries(participantFieldErrors(fields, p))) {
        errors[`${inst.uid}.${i}.${key}`] = msg
      }
    })
  }

  return errors
}
