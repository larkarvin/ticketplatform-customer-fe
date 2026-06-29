// app/features/events/checkoutReview.ts
// Pure builder: turns the cart + add-on answers into read-back groups for the review step.
// Names only per attendee (the identity field's value). Empty groups are omitted.
import type { Field } from '#core/field-engine/types'
import type { ReviewGroup } from '~/core/types/review'
import type { CartTicket, PublicEvent } from '~/features/events/types'

export const EDIT_ATTENDEES = 0
export const EDIT_ADDONS = 1

function identityKey(fields: Field[]): string | null {
  const f = fields.find((x) => x.required && ['text', 'name'].includes(x.type))
  return f?.field_key ?? fields[0]?.field_key ?? null
}

function formatAnswer(field: Field, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (field.type === 'select') {
    const opt = field.options.find((o) => o.option_key === String(value))
    return opt?.label ?? String(value)
  }
  return typeof value === 'string' ? value : String(value)
}

export function buildReviewGroups(
  event: PublicEvent,
  cart: CartTicket[],
  checkoutAnswers: Record<string, unknown>
): ReviewGroup[] {
  const groups: ReviewGroup[] = []

  const counts = new Map<number, number>()
  const attendeeItems = cart.flatMap((inst) => {
    const ticket = event.tickets.find((t) => t.id === inst.ticket_id)
    if (!ticket) return []
    const n = (counts.get(inst.ticket_id) ?? 0) + 1
    counts.set(inst.ticket_id, n)
    if (ticket.collect_details_later) {
      return [
        {
          key: inst.uid,
          label: `${ticket.name} · #${n}`,
          value: `${inst.participants.length} attendees — names added after payment`,
        },
      ]
    }
    const idKey = identityKey(ticket.participant_fields ?? [])
    return inst.participants.map((p, i) => ({
      key: `${inst.uid}.${i}`,
      label:
        ticket.participant_type === 'group'
          ? `${ticket.name} · #${n} — Participant ${i + 1}`
          : `${ticket.name} · #${n}`,
      value: (idKey ? String(p.field_data[idKey] ?? '') : '') || '—',
    }))
  })
  if (attendeeItems.length) groups.push({ editTarget: EDIT_ATTENDEES, title: "Who's coming", items: attendeeItems })

  const addonItems = (event.form_fields ?? [])
    .map((f) => ({ key: f.field_key, label: f.label, value: formatAnswer(f, checkoutAnswers[f.field_key]) }))
    .filter((it) => it.value !== '')
  if (addonItems.length) groups.push({ editTarget: EDIT_ADDONS, title: 'Optional extras', items: addonItems })

  return groups
}
