// customer-fe/app/features/events/components/EventTicketList.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PublicTicket } from '../types'
import EventTicketList from './EventTicketList.vue'

function ticket(p: Partial<PublicTicket> = {}): PublicTicket {
  return {
    id: 1,
    name: 'GA',
    description: null,
    price: 100,
    price_formatted: '₱100.00',
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
    ...p,
  } as PublicTicket
}

describe('EventTicketList', () => {
  it('disables Get tickets until a quantity is chosen, then emits the selection', async () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket({ id: 7 })] } })
    const cta = w.find('[data-testid="get-tickets"]')
    expect(cta.attributes('disabled')).toBeDefined()
    await w.find('[aria-label^="Increase quantity"]').trigger('click')
    expect(cta.attributes('disabled')).toBeUndefined()
    await cta.trigger('click')
    expect(w.emitted('checkout')?.[0]).toEqual([[{ ticket_id: 7, quantity: 1 }]])
  })

  it('shows an empty state when there are no tickets', () => {
    const w = mount(EventTicketList, { props: { tickets: [] } })
    expect(w.text()).toContain("aren't available yet")
  })

  it('first increment on a min_per_order:2 ticket jumps to 2', async () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket({ id: 3, min_per_order: 2 })] } })
    await w.find('[aria-label^="Increase quantity"]').trigger('click')
    const cta = w.find('[data-testid="get-tickets"]')
    await cta.trigger('click')
    expect(w.emitted('checkout')?.[0]).toEqual([[{ ticket_id: 3, quantity: 2 }]])
  })

  it('sold-out ticket: increment is disabled, "Sold out" label shows, CTA stays disabled', () => {
    const w = mount(EventTicketList, { props: { tickets: [ticket({ id: 5, is_available: false })] } })
    const incBtn = w.find('[aria-label^="Increase quantity"]')
    expect(incBtn.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Sold out')
    const cta = w.find('[data-testid="get-tickets"]')
    expect(cta.attributes('disabled')).toBeDefined()
  })
})
