// customer-fe/app/features/events/components/EventTicketList.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicTicket } from '../types'
import EventTicketList from './EventTicketList.vue'

function ticket(p: Partial<PublicTicket> = {}): PublicTicket {
  return {
    id: 1, name: 'General', description: null,
    price: 2500, price_formatted: '$25.00',
    early_bird_price: null, early_bird_ends_at: null, currency: 'USD',
    is_on_sale: true, is_available: true, available_quantity: null,
    sales_start_at: null, sales_end_at: null, sort_order: 0, ...p,
  }
}

describe('EventTicketList', () => {
  it('lists tickets with name and formatted price', () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket({ name: 'VIP', price_formatted: '$99.00' })] } })
    expect(w.text()).toContain('VIP')
    expect(w.text()).toContain('$99.00')
  })

  it('shows a disabled Get tickets CTA labelled on sale soon', () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket()] } })
    const btn = w.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('On sale soon')
  })

  it('shows an empty state when there are no tickets', () => {
    const w = mount(EventTicketList, { props: { tickets: [] } })
    expect(w.text()).toContain("aren't available yet")
  })
})
