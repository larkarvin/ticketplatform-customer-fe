import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { PublicEvent } from '../../types'
import CheckoutTickets from './CheckoutTickets.vue'

const event: PublicEvent = {
  id: 1,
  series_id: null,
  type: null,
  title: 'Test Event',
  slug: 'test-event',
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
  collects_info: false,
  available_capacity: null,
  form_fields: null,
  tickets: [
    {
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
      collect_details_later: false,
      participant_fields: [],
      participant_type: 'single',
      min_participants: 1,
      max_participants: 1,
      admits_per_ticket: 1,
      ask_group_name: false,
      group_name_label: '',
    },
    {
      id: 2,
      name: 'VIP',
      description: null,
      price: 500,
      price_formatted: '₱500.00',
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
      max_per_order: 5,
      sort_order: 1,
      collect_details_later: false,
      participant_fields: [],
      participant_type: 'single',
      min_participants: 1,
      max_participants: 1,
      admits_per_ticket: 1,
      ask_group_name: false,
      group_name_label: '',
    },
  ],
}

const baseProps = () => ({
  event,
  quantityOf: (id: number) => (id === 1 ? 2 : 0),
  maxFor: (id: number) => (id === 1 ? 10 : 5),
  onAdd: vi.fn(),
  onRemoveOne: vi.fn(),
})

describe('CheckoutTickets', () => {
  it('renders one QuantityStepper per ticket type', () => {
    const w = mount(CheckoutTickets, { props: baseProps() })
    expect(w.findAllComponents({ name: 'QuantityStepper' })).toHaveLength(2)
  })

  it('displays the current quantity in each stepper', () => {
    const w = mount(CheckoutTickets, { props: baseProps() })
    const steppers = w.findAllComponents({ name: 'QuantityStepper' })
    expect(steppers[0]?.props('value')).toBe(2)
    expect(steppers[1]?.props('value')).toBe(0)
  })

  it('calls onAdd when the increment button is clicked', async () => {
    const onAdd = vi.fn()
    const w = mount(CheckoutTickets, { props: { ...baseProps(), onAdd } })
    // Click increment on the first stepper (GA, id=1)
    const incrementBtn = w.findAll('button').find((b) => b.attributes('aria-label')?.includes('Increase'))
    await incrementBtn?.trigger('click')
    expect(onAdd).toHaveBeenCalledWith(1)
  })

  it('calls onRemoveOne when the decrement button is clicked', async () => {
    const onRemoveOne = vi.fn()
    const w = mount(CheckoutTickets, { props: { ...baseProps(), onRemoveOne } })
    // Click decrement on the first stepper (GA, id=1, qty=2 so enabled)
    const decrementBtn = w.findAll('button').find((b) => b.attributes('aria-label')?.includes('Decrease'))
    await decrementBtn?.trigger('click')
    expect(onRemoveOne).toHaveBeenCalledWith(1)
  })

  it('disables decrement when quantity is 0', () => {
    const w = mount(CheckoutTickets, {
      props: { ...baseProps(), quantityOf: () => 0 },
    })
    const decrementBtns = w.findAll('button').filter((b) => b.attributes('aria-label')?.includes('Decrease'))
    decrementBtns.forEach((btn) => expect(btn.attributes('disabled')).toBeDefined())
  })

  it('disables increment when quantity equals max', () => {
    const w = mount(CheckoutTickets, {
      props: {
        ...baseProps(),
        quantityOf: (id: number) => (id === 1 ? 10 : 5),
        maxFor: (id: number) => (id === 1 ? 10 : 5),
      },
    })
    const incrementBtns = w.findAll('button').filter((b) => b.attributes('aria-label')?.includes('Increase'))
    incrementBtns.forEach((btn) => expect(btn.attributes('disabled')).toBeDefined())
  })

  it('renders each ticket name', () => {
    const w = mount(CheckoutTickets, { props: baseProps() })
    expect(w.text()).toContain('GA')
    expect(w.text()).toContain('VIP')
  })
})
