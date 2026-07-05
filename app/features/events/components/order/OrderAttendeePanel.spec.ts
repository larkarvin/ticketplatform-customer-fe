import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicOrder } from '../../types'
import OrderAttendeePanel from './OrderAttendeePanel.vue'

const order: PublicOrder = {
  public_id: 'p1',
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
  can_add_attendees: true,
  items: [
    {
      type: 'ticket',
      unit_name: 'GA',
      quantity: 1,
      unit_price: '10',
      subtotal: '10',
      ticket_id: 1,
      participant_fields: [
        {
          id: 1,
          field_key: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          col_span: 12,
          options: [],
          visibility: 'public',
          field_group_id: null,
          placeholder: null,
          description: null,
          min: null,
          max: null,
          allow_decimal: null,
          settings: {},
          sort_order: 0,
        },
      ],
      attendees: [{ id: 5, field_data: {}, status: 'pending' }],
    },
  ],
}

describe('OrderAttendeePanel', () => {
  it('emits a submit with per-attendee field_data', async () => {
    const w = mount(OrderAttendeePanel, { props: { order, errors: {}, saving: false } })
    await w.find('[data-test="save-attendees"]').trigger('click')
    expect(w.emitted('submit')?.[0]?.[0]).toEqual([{ id: 5, field_data: {} }])
  })

  it('disables the save button while saving', () => {
    const w = mount(OrderAttendeePanel, { props: { order, errors: {}, saving: true } })
    expect(w.get('[data-test="save-attendees"]').attributes('disabled')).toBeDefined()
  })
})
