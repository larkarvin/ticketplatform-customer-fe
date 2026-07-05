// Public event DTOs (snake_case — the API contract shape) for the read-only event page.
import type { Field } from '#core/field-engine/types'

export interface EventMedia {
  id: number
  url: string
  name?: string
  mime_type?: string
  size?: number
}

export interface PublicTicket {
  id: number
  name: string
  description: string | null
  price: number
  price_formatted: string
  early_bird_price: number | null
  early_bird_ends_at: string | null
  is_early_bird: boolean
  early_bird_price_formatted: string | null
  currency: string
  is_on_sale: boolean
  is_available: boolean
  available_quantity: number | null
  sales_start_at: string | null
  sales_end_at: string | null
  min_per_order: number
  max_per_order: number
  sort_order: number
  collect_details_later: boolean
  participant_fields: Field[]
  participant_type: 'single' | 'group'
  min_participants: number
  max_participants: number
  admits_per_ticket: number
  ask_group_name: boolean
  group_name_label: string
}

export interface CartParticipant {
  field_data: Record<string, unknown>
}

export interface CartTicket {
  uid: string
  ticket_id: number
  group_name?: string
  participants: CartParticipant[]
}

export interface PublicEvent {
  id: number
  series_id: number | null
  type: string | null
  title: string
  slug: string
  year: number | null
  description: string | null
  details: string | null
  location: string | null
  location_details: string | null
  starts_at: string
  ends_at: string | null
  timezone: string | null
  currency: string
  is_featured: boolean
  visibility: string
  cover: EventMedia | null
  has_capacity: boolean
  available_capacity: number | null
  tickets: PublicTicket[]
  form_fields: Field[] | null
  // Backend-computed: true when checkout has attendee details or extras to collect. When false, the
  // buyer skips the entry step and lands straight on review (nothing to fill in).
  collects_info: boolean
}

/** A buyer's chosen quantity per ticket, from the event card. */
export interface CheckoutSelection {
  ticket_id: number
  quantity: number
}

/** The register request body (matches the API TicketOrderService payload). */
export interface RegisterPayload {
  buyer: { email: string; name?: string; phone?: string }
  tickets: Array<{
    ticket_id: number
    quantity: number
    group_name?: string
    participants: Array<{ field_data: Record<string, unknown> }>
  }>
  checkout: Record<string, unknown>
}

export interface EventOrderResponse {
  public_id: string
  order_number: string
  requires_payment: boolean
  payment_total: number
  currency: string
}

export interface OrderAttendee {
  id: number
  field_data: Record<string, unknown>
  status: string
}

export interface AttendeeSubmission {
  id: number
  field_data: Record<string, unknown>
}

export interface PublicOrderItem {
  type: string
  name: string
  quantity: number
  unit_price: string
  subtotal: string
  ticket_id: number | null
  participant_fields: Field[]
  attendees: OrderAttendee[]
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded'

export interface PublicOrder {
  public_id: string
  order_number: string
  currency: string
  total: string
  payment_status: PaymentStatus
  expires_at: string | null
  can_be_paid: boolean
  event_slug: string | null
  items: PublicOrderItem[]
  can_add_attendees: boolean
}

export interface CalcLine {
  kind: 'ticket' | 'addon'
  label: string
  quantity: number
  unit_price: number
  amount: number
}

export interface OrderCalculation {
  currency: string
  items: CalcLine[]
  subtotal: number
  fees: { label: string; amount: number }[]
  fees_total: number
  taxes: { label: string; amount: number }[]
  taxes_total: number
  total: number
}

/** Shape returned by the payment-status endpoint (raw JsonResponse, no data wrapper). */
export interface PaymentStatusResponse {
  success: boolean
  status: string
  order_number?: string
  paid_at?: string
  message?: string
}

/**
 * Shape returned by POST /events/public/{slug}/register (EventOrderResponseResource).
 * Confirmed fields: public_id, order_number, requires_payment, payment_total, currency.
 */
export type PublicOrderRegisterResponse = EventOrderResponse
