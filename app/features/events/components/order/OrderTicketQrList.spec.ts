import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicOrder } from '../../types'
import OrderTicketQrList from './OrderTicketQrList.vue'

const order: PublicOrder = {
  public_id: 'PUB123',
  order_number: 'X',
  type: 'event',
  source_name: 'E',
  source_slug: 'e',
  currency: 'USD',
  subtotal: '10',
  fees: [],
  fees_total: '0',
  total: '10',
  payment_status: 'paid',
  expires_at: null,
  paid_at: null,
  can_be_paid: false,
  event_slug: 'e',
  can_add_attendees: false,
  items: [
    {
      type: 'ticket',
      unit_name: 'GA',
      quantity: 1,
      unit_price: '10',
      subtotal: '10',
      ticket_id: 1,
      participant_fields: [],
      attendees: [{ id: 5, field_data: {}, status: 'pending' }],
    },
    {
      type: 'ticket',
      unit_name: 'VIP',
      quantity: 1,
      unit_price: '10',
      subtotal: '10',
      ticket_id: 2,
      participant_fields: [],
      attendees: [{ id: 9, field_data: {}, status: 'pending' }],
    },
  ],
}

beforeEach(() => {
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiUrl: 'https://api.test/api/v1' } }))
})

describe('OrderTicketQrList', () => {
  it('renders one QR image per attendee with the expected src and alt', () => {
    const w = mount(OrderTicketQrList, { props: { order, publicId: 'PUB123' } })
    const imgs = w.findAll('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0]?.attributes('src')).toBe('https://api.test/api/v1/orders/PUB123/participants/5/qr')
    expect(imgs[1]?.attributes('src')).toBe('https://api.test/api/v1/orders/PUB123/participants/9/qr')
    expect(imgs[0]?.attributes('alt')).toBeTruthy()
  })

  it('renders nothing when there are no attendees', () => {
    const emptyOrder: PublicOrder = {
      ...order,
      items: order.items.map((i) => ({ ...i, attendees: [] })),
    }
    const w = mount(OrderTicketQrList, { props: { order: emptyOrder, publicId: 'PUB123' } })
    expect(w.find('section').exists()).toBe(false)
  })
})
