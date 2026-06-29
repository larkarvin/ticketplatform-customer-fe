import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { OrderCalculation } from '../../types'
import OrderBreakdown from './OrderBreakdown.vue'

const calc: OrderCalculation = {
  currency: 'PHP',
  items: [{ kind: 'ticket', label: 'GA', quantity: 2, unit_price: 100, amount: 200 }],
  subtotal: 200,
  fees: [{ label: 'Service fee', amount: 10 }],
  fees_total: 10,
  taxes: [{ label: 'VAT', amount: 5 }],
  taxes_total: 5,
  total: 215,
}

describe('OrderBreakdown', () => {
  it('renders items, fees, taxes and the total', () => {
    const w = mount(OrderBreakdown, { props: { calculation: calc, status: 'idle' } })
    expect(w.text()).toContain('GA')
    expect(w.text()).toContain('Service fee')
    expect(w.text()).toContain('VAT')
    expect(w.text()).toContain('PHP 215.00')
  })

  it('shows a fallback when there is no calculation', () => {
    const w = mount(OrderBreakdown, { props: { calculation: null, status: 'idle' } })
    expect(w.text()).toContain('No items yet')
  })
})
