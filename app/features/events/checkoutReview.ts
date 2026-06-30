// app/features/events/checkoutReview.ts
// Pure builder: turns the cart + add-on answers into read-back groups for the review step.
// Names only per attendee (the identity field's value). Tickets that collect no details (no
// participant fields and not collect_details_later) contribute nothing — mirroring the entry page —
// so "Who's coming" is omitted entirely when nothing the buyer purchased asks for attendee details.
// Empty groups are omitted.
import type { Field } from '#core/field-engine/types'
import { variantLabel } from '~/core/product/variantLabel'
import type { ProductFieldInfo, ProductSelection } from '~/core/types/product'
import type { ReviewGroup } from '~/core/types/review'
import type { CartTicket, PublicEvent } from '~/features/events/types'
import { identityKey } from './identityKey'

export const EDIT_ATTENDEES = 0
export const EDIT_ADDONS = 1
export const EDIT_TICKETS = 2

function formatAnswer(field: Field, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (field.type === 'select') {
    const opt = field.options.find((o) => o.option_key === String(value))
    return opt?.label ?? String(value)
  }
  // Product (merch) add-on: an array of { variant_id, quantity }. Render "2 × Shirt (Large)" using
  // the product metadata, matching how the form's review reads it back.
  const product = field.settings.product as ProductFieldInfo | undefined
  if (Array.isArray(value)) {
    if (!product) return value.filter((v) => typeof v === 'string').join(', ')
    return (value as ProductSelection[])
      .map((sel) => {
        const v = product.variants.find((vr) => vr.id === sel.variant_id)
        if (!v) return null
        const variant = variantLabel(v)
        return product.name && variant !== product.name
          ? `${sel.quantity} × ${product.name} (${variant})`
          : `${sel.quantity} × ${variant}`
      })
      .filter((line): line is string => line !== null)
      .join(', ')
  }
  // Never surface a raw object (e.g. "[object Object]"); only strings/numbers are meaningful here.
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

/** First email a participant (then an order-level extra) has already entered, used to pre-fill the
 *  receipt email — a parent buying for the group has typically just typed it on Participant 1. Scans in
 *  reading order (instances → participants → fields, then extras) and returns the first non-empty value. */
export function firstOrderEmail(
  event: PublicEvent,
  cart: CartTicket[],
  checkoutAnswers: Record<string, unknown>
): string {
  for (const inst of cart) {
    const ticket = event.tickets.find((t) => t.id === inst.ticket_id)
    if (!ticket) continue
    const emailFields = (ticket.participant_fields ?? []).filter((f) => f.type === 'email')
    for (const p of inst.participants) {
      for (const f of emailFields) {
        const v = p.field_data[f.field_key]
        if (typeof v === 'string' && v.trim() !== '') return v.trim()
      }
    }
  }
  for (const f of event.form_fields ?? []) {
    if (f.type !== 'email') continue
    const v = checkoutAnswers[f.field_key]
    if (typeof v === 'string' && v.trim() !== '') return v.trim()
  }
  return ''
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
    // Skip tickets that collect no attendee details (no fields and not deferred) — same rule the
    // entry page uses to decide which tickets show a participant card.
    const hasFields = (ticket.participant_fields?.length ?? 0) > 0
    if (!ticket.collect_details_later && !hasFields) return []
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
