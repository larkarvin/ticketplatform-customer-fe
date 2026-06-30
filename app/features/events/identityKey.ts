// Shared helper: the identity key is the first required text-or-name field, else the very first
// field. Used in checkoutReview (to display the attendee name) and checkout.vue (to pass the
// right field key into ParticipantGroup). One definition, three call sites.
import type { Field } from '#core/field-engine/types'

/**
 * Returns the field_key of the field that best identifies a participant:
 * - first required field whose type is "text" or "name", or
 * - first field in the list, or
 * - null when the list is empty.
 */
export function identityKey(fields: Field[]): string | null {
  const f = fields.find((x) => x.required && ['text', 'name'].includes(x.type))
  return f?.field_key ?? fields[0]?.field_key ?? null
}
