// Public event DTOs (snake_case — the API contract shape) for the read-only event page.

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
  order_number: string
  requires_payment: boolean
  payment_total: number
  currency: string
}

export interface PublicOrderItem {
  type: string
  name: string
  quantity: number
  unit_price: string
  subtotal: string
}

export interface PublicOrder {
  order_number: string
  currency: string
  total: string
  payment_status: string
  can_be_paid: boolean
  items: PublicOrderItem[]
}

/** Shape returned by the payment-status endpoint (raw JsonResponse, no data wrapper). */
export interface PaymentStatusResponse {
  success: boolean
  status: string
  order_number?: string
  paid_at?: string
  message?: string
}
