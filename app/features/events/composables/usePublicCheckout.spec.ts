import { ValidationError } from '#core/errors'
import type { Field } from '#core/field-engine/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import type { CartTicket, PublicEvent } from '~/features/events/types'
import { usePublicCheckout } from './usePublicCheckout'

const { calculateOrder } = vi.hoisted(() => ({ calculateOrder: vi.fn() }))
vi.mock('~/features/events/services/events.service', () => ({ eventsService: { calculateOrder } }))

const { registerOrder, initiatePayment } = vi.hoisted(() => ({
  registerOrder: vi.fn(),
  initiatePayment: vi.fn(),
}))
vi.mock('~/features/events/services/orders.service', () => ({
  ordersService: { registerOrder, initiatePayment },
}))

function event(): PublicEvent {
  return {
    id: 1,
    series_id: null,
    type: null,
    title: 'Gala',
    slug: 'gala',
    year: null,
    description: null,
    details: null,
    location: null,
    location_details: null,
    starts_at: '2026-01-01T00:00:00Z',
    ends_at: null,
    timezone: null,
    currency: 'PHP',
    is_featured: false,
    visibility: 'public',
    cover: null,
    has_capacity: false,
    available_capacity: null,
    form_fields: null,
    tickets: [
      {
        id: 1,
        name: 'GA',
        description: null,
        price: 100,
        price_formatted: '₱100',
        early_bird_price: null,
        early_bird_ends_at: null,
        is_early_bird: false,
        early_bird_price_formatted: null,
        currency: 'PHP',
        is_on_sale: true,
        is_available: true,
        available_quantity: null,
        sales_start_at: null,
        sales_end_at: null,
        min_per_order: 1,
        max_per_order: 10,
        sort_order: 0,
        collect_details_later: false,
        participant_fields: [],
        participant_type: 'single' as const,
        min_participants: 1,
        max_participants: 1,
        admits_per_ticket: 1,
        ask_group_name: false,
        group_name_label: 'Group name',
      },
    ],
  }
}

function mockCalcResult() {
  return {
    currency: 'PHP',
    items: [],
    subtotal: 200,
    fees: [],
    fees_total: 0,
    taxes: [],
    taxes_total: 0,
    total: 200,
  }
}

describe('usePublicCheckout', () => {
  beforeEach(() => {
    calculateOrder.mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('buildCalcPayload emits one entry per cart instance carrying group_name', async () => {
    calculateOrder.mockResolvedValue(mockCalcResult())

    const cart = ref<CartTicket[]>([
      {
        uid: 'a',
        ticket_id: 1,
        group_name: 'Table A',
        participants: [{ field_data: { name: 'Alice' } }],
      },
      {
        uid: 'b',
        ticket_id: 1,
        group_name: 'Table B',
        participants: [{ field_data: { name: 'Bob' } }],
      },
    ])

    const c = usePublicCheckout(event(), cart)
    c.recalcTotals()
    await vi.runAllTimersAsync()

    expect(calculateOrder).toHaveBeenCalledWith(
      'gala',
      expect.objectContaining({
        tickets: [
          { ticket_id: 1, quantity: 1, group_name: 'Table A', participants: [{ field_data: { name: 'Alice' } }] },
          { ticket_id: 1, quantity: 1, group_name: 'Table B', participants: [{ field_data: { name: 'Bob' } }] },
        ],
      })
    )
  })

  it('omits group_name when undefined on the instance', async () => {
    calculateOrder.mockResolvedValue(mockCalcResult())

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])

    const c = usePublicCheckout(event(), cart)
    c.recalcTotals()
    await vi.runAllTimersAsync()

    const [, payload] = calculateOrder.mock.calls[0] as [string, { tickets: Array<{ group_name?: string }> }]
    expect(payload.tickets[0]?.group_name).toBeUndefined()
  })

  it('exposes calculation after a successful recalc', async () => {
    calculateOrder.mockResolvedValue(mockCalcResult())

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [] }])
    const c = usePublicCheckout(event(), cart)

    expect(c.calculation.value).toBeNull()
    c.recalcTotals()
    await vi.runAllTimersAsync()
    expect(c.calculation.value?.total).toBe(200)
  })
})

const nameField: Field = {
  id: 1,
  field_key: 'full_name',
  type: 'text',
  label: 'Full name',
  required: true,
  col_span: 12,
  options: [],
  settings: {},
  visibility: 'public',
  description: null,
  placeholder: null,
  min: null,
  max: null,
  allow_decimal: null,
  field_group_id: null,
  sort_order: 0,
}
const eventWithField = {
  id: 1,
  series_id: null,
  type: null,
  title: 'x',
  slug: 'x',
  year: null,
  description: null,
  details: null,
  location: null,
  location_details: null,
  starts_at: '',
  ends_at: null,
  timezone: null,
  currency: 'PHP',
  is_featured: false,
  visibility: 'public',
  cover: null,
  has_capacity: false,
  available_capacity: null,
  tickets: [
    {
      id: 9,
      name: 'GA',
      description: null,
      price: 100,
      price_formatted: '₱100',
      early_bird_price: null,
      early_bird_ends_at: null,
      is_early_bird: false,
      early_bird_price_formatted: null,
      currency: 'PHP',
      is_on_sale: true,
      is_available: true,
      available_quantity: null,
      sales_start_at: null,
      sales_end_at: null,
      min_per_order: 1,
      max_per_order: 10,
      sort_order: 0,
      participant_type: 'single' as const,
      min_participants: 1,
      max_participants: 1,
      admits_per_ticket: 1,
      ask_group_name: false,
      group_name_label: '',
      collect_details_later: false,
      participant_fields: [nameField],
    },
  ],
  form_fields: null,
} as PublicEvent

describe('usePublicCheckout.validate', () => {
  it('returns false and records errors when required fields are empty', () => {
    const cart = ref<CartTicket[]>([{ uid: 'u1', ticket_id: 9, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(eventWithField, cart)
    expect(c.validate()).toBe(false)
    expect(c.fieldErrors.value['u1.0.full_name']).toBeTruthy()
  })

  it('returns true and clears errors when all participant fields are valid', () => {
    const cart = ref<CartTicket[]>([{ uid: 'u1', ticket_id: 9, participants: [{ field_data: { full_name: 'Juan' } }] }])
    const c = usePublicCheckout(eventWithField, cart)
    // email is NOT checked by validate() — only participant fields
    expect(c.validate()).toBe(true)
    expect(Object.keys(c.fieldErrors.value)).toHaveLength(0)
  })

  it('does NOT fail when email is empty (email is checked only in placeAndPay)', () => {
    const cart = ref<CartTicket[]>([{ uid: 'u1', ticket_id: 9, participants: [{ field_data: { full_name: 'Juan' } }] }])
    const c = usePublicCheckout(eventWithField, cart)
    // email starts as '' by default; validate() must not produce a buyer.email error
    expect(c.validate()).toBe(true)
    expect(c.fieldErrors.value['buyer.email']).toBeUndefined()
  })
})

const navigateTo = vi.fn()

describe('usePublicCheckout.placeAndPay', () => {
  let assignSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    registerOrder.mockReset()
    initiatePayment.mockReset()
    navigateTo.mockReset()
    vi.stubGlobal('navigateTo', navigateTo)
    // happy-dom: stub window.location so origin + assign are controllable
    assignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost', assign: assignSpy },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls registerOrder with buyer in payload, then initiatePayment, then assigns redirect_url', async () => {
    registerOrder.mockResolvedValue({
      public_id: '11111111-1111-4111-8111-111111111111',
      order_number: 'ORD-001',
      requires_payment: true,
      payment_total: 100,
      currency: 'PHP',
    })
    initiatePayment.mockResolvedValue({ redirect_url: 'https://pay.example.com/xyz' })

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    // Fill buyer so validate passes (event() has no required participant fields)
    c.buyer.email = 'buyer@example.com'
    c.buyer.name = 'Buyer'

    await c.placeAndPay()

    expect(registerOrder).toHaveBeenCalledOnce()
    const [slug, payload] = registerOrder.mock.calls[0] as [
      string,
      { buyer: { email: string; name: string }; tickets: unknown[]; checkout: unknown },
    ]
    expect(slug).toBe('gala')
    expect(payload.buyer).toEqual({ email: 'buyer@example.com', name: 'Buyer', phone: '' })
    expect(payload.tickets).toHaveLength(1)

    // Navigation/pay must address the order by public_id, not the display-only order_number.
    expect(initiatePayment).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'http://localhost/orders/11111111-1111-4111-8111-111111111111'
    )
    expect(assignSpy).toHaveBeenCalledWith('https://pay.example.com/xyz')
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('calls navigateTo when redirect_url is absent (free / already-paid path)', async () => {
    registerOrder.mockResolvedValue({
      public_id: '22222222-2222-4222-8222-222222222222',
      order_number: 'ORD-002',
      requires_payment: false,
      payment_total: 0,
      currency: 'PHP',
    })
    initiatePayment.mockResolvedValue({ redirect_url: undefined })

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    c.buyer.email = 'buyer@example.com'

    await c.placeAndPay()

    expect(navigateTo).toHaveBeenCalledWith('/orders/22222222-2222-4222-8222-222222222222')
    expect(assignSpy).not.toHaveBeenCalled()
  })

  it('does not call services and keeps submitting false when validation fails', async () => {
    const cart = ref<CartTicket[]>([{ uid: 'u1', ticket_id: 9, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(eventWithField, cart)
    // Do NOT fill in required full_name — validate() returns false

    await c.placeAndPay()

    expect(registerOrder).not.toHaveBeenCalled()
    expect(initiatePayment).not.toHaveBeenCalled()
    expect(c.submitting.value).toBe(false)
  })

  it('maps a 422 ValidationError to fieldErrors and resets submitting', async () => {
    registerOrder.mockRejectedValue(new ValidationError({ 'buyer.email': 'Invalid email' }))

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    c.buyer.email = 'buyer@example.com'

    await c.placeAndPay()

    expect(c.fieldErrors.value['buyer.email']).toBe('Invalid email')
    expect(c.submitting.value).toBe(false)
  })

  it('sets submitError and resets submitting on a non-422 error', async () => {
    registerOrder.mockRejectedValue(new Error('Network failure'))

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    c.buyer.email = 'buyer@example.com'

    await c.placeAndPay()

    expect(c.submitError.value).toBeTruthy()
    expect(c.submitting.value).toBe(false)
  })

  it('retry after a post-register failure reuses the order: registerOrder once, initiatePayment twice', async () => {
    registerOrder.mockResolvedValue({
      public_id: '77777777-7777-4777-8777-777777777777',
      order_number: 'ORD-777',
      requires_payment: true,
      payment_total: 100,
      currency: 'PHP',
    })
    // First initiatePayment throws (e.g. gateway hiccup); second succeeds.
    initiatePayment.mockRejectedValueOnce(new Error('gateway down'))
    initiatePayment.mockResolvedValueOnce({ redirect_url: 'https://pay.example.com/abc' })

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    c.buyer.email = 'buyer@example.com'

    // First attempt: registers, then initiatePayment throws → submitError set, submitting reset.
    await c.placeAndPay()
    expect(c.submitError.value).toBeTruthy()
    expect(c.submitting.value).toBe(false)

    // Retry: must NOT register again — reuses the same public_id and re-initiates payment.
    await c.placeAndPay()

    expect(registerOrder).toHaveBeenCalledOnce()
    expect(initiatePayment).toHaveBeenCalledTimes(2)
    expect(initiatePayment).toHaveBeenLastCalledWith(
      '77777777-7777-4777-8777-777777777777',
      'http://localhost/orders/77777777-7777-4777-8777-777777777777'
    )
    expect(assignSpy).toHaveBeenCalledWith('https://pay.example.com/abc')
  })

  it('clears the cached order when the cart selection changes (edit forces a fresh order)', async () => {
    registerOrder.mockResolvedValue({
      public_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      order_number: 'ORD-A',
      requires_payment: true,
      payment_total: 100,
      currency: 'PHP',
    })
    initiatePayment.mockRejectedValueOnce(new Error('gateway down'))
    initiatePayment.mockResolvedValue({ redirect_url: 'https://pay.example.com/x' })

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    c.buyer.email = 'buyer@example.com'

    await c.placeAndPay() // registers ORD-A, payment fails
    expect(registerOrder).toHaveBeenCalledOnce()

    // Edit the cart → the watcher resets the cached order.
    cart.value = [...cart.value, { uid: 'b', ticket_id: 1, participants: [{ field_data: {} }] }]
    await nextTick() // let the watcher flush so the cached order is reset

    await c.placeAndPay()
    expect(registerOrder).toHaveBeenCalledTimes(2)
  })

  it('does not call registerOrder when buyer email is missing', async () => {
    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    // email is '' by default — do NOT set it

    await c.placeAndPay()

    expect(registerOrder).not.toHaveBeenCalled()
    expect(c.fieldErrors.value['buyer.email']).toBe('Please enter your email so we can send your receipt.')
    expect(c.submitting.value).toBe(false)
  })

  it('does not call registerOrder and sets buyer.email error when email format is invalid', async () => {
    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    c.buyer.email = 'notanemail'

    await c.placeAndPay()

    expect(registerOrder).not.toHaveBeenCalled()
    expect(c.fieldErrors.value['buyer.email']).toBe('Please enter a valid email address.')
    expect(c.submitting.value).toBe(false)
  })

  it('reentrancy guard: a second call while one is in-flight does not fire registerOrder again', async () => {
    // Deferred promise — stays pending so the first placeAndPay never resolves during this test.
    type OrderResult = {
      public_id: string
      order_number: string
      requires_payment: boolean
      payment_total: number
      currency: string
    }
    let resolveOrder!: (v: OrderResult) => void
    const pendingOrder = new Promise<OrderResult>((res) => {
      resolveOrder = res
    })
    registerOrder.mockReturnValue(pendingOrder)

    const cart = ref<CartTicket[]>([{ uid: 'a', ticket_id: 1, participants: [{ field_data: {} }] }])
    const c = usePublicCheckout(event(), cart)
    c.buyer.email = 'buyer@example.com'

    // First call — starts but does not await (stays in-flight).
    const first = c.placeAndPay()

    // Second call while first is in-flight — must be a no-op.
    await c.placeAndPay()

    // Resolve the pending order so the first call can complete cleanly.
    resolveOrder({
      public_id: '99999999-9999-4999-8999-999999999999',
      order_number: 'ORD-999',
      requires_payment: false,
      payment_total: 0,
      currency: 'PHP',
    })
    initiatePayment.mockResolvedValue({ redirect_url: undefined })
    await first

    expect(registerOrder).toHaveBeenCalledOnce()
  })
})
