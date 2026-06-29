// customer-fe/app/features/events/components/EventTicketList.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicTicket } from '../types'
import EventTicketList from './EventTicketList.vue'

function ticket(p: Partial<PublicTicket> = {}): PublicTicket {
  return {
    id: 1,
    name: 'General',
    description: null,
    price: 2500,
    price_formatted: '$25.00',
    early_bird_price: null,
    early_bird_ends_at: null,
    currency: 'USD',
    is_on_sale: true,
    is_available: true,
    available_quantity: null,
    sales_start_at: null,
    sales_end_at: null,
    sort_order: 0,
    ...p,
  }
}

describe('EventTicketList', () => {
  it('lists tickets with name and price', () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket({ name: 'VIP', price_formatted: '$99.00' })] } })
    expect(w.text()).toContain('VIP')
    expect(w.text()).toContain('$99.00')
  })

  it('renders a Buy button per ticket and emits buy with the ticket id', async () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket({ id: 7 })] } })
    const btn = w.find('button')
    expect(btn.text()).toBe('Buy ticket')
    expect(btn.attributes('disabled')).toBeUndefined()
    await btn.trigger('click')
    expect(w.emitted('buy')?.[0]).toEqual([7])
  })

  it('shows the early-bird price with the regular price struck through', () => {
    const w = mount(EventTicketList, {
      props: { tickets: [ticket({ price_formatted: '$50.00', early_bird_price: 40, early_bird_ends_at: null })] },
    })
    expect(w.text()).toContain('$40.00') // early-bird (current) price
    expect(w.find('.line-through').text()).toContain('$50.00') // regular price, struck
  })

  it('disables the button and shows status when a ticket is sold out', () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket({ is_available: false })] } })
    const btn = w.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toBe('Sold out')
  })

  it('shows an empty state when there are no tickets', () => {
    const w = mount(EventTicketList, { props: { tickets: [] } })
    expect(w.text()).toContain("aren't available yet")
  })
})
