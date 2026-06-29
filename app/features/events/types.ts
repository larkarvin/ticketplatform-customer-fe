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
