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

  it('shows no Edit link by default', () => {
    const w = mount(OrderBreakdown, { props: { calculation: calc, status: 'idle' } })
    expect(w.find('[data-test="edit-order"]').exists()).toBe(false)
  })

  it('emits edit from the Edit link when editable', async () => {
    const w = mount(OrderBreakdown, { props: { calculation: calc, status: 'idle', editable: true } })
    await w.get('[data-test="edit-order"]').trigger('click')
    expect(w.emitted('edit')).toHaveLength(1)
  })

  it('renders a Platform fee row with the formatted amount when the server includes it', () => {
    const calcWithPlatformFee: OrderCalculation = {
      currency: 'PHP',
      items: [{ kind: 'ticket', label: 'GA', quantity: 1, unit_price: 100, amount: 100 }],
      subtotal: 100,
      fees: [{ label: 'Platform fee', amount: 5 }],
      fees_total: 5,
      taxes: [],
      taxes_total: 0,
      total: 105,
    }
    const w = mount(OrderBreakdown, { props: { calculation: calcWithPlatformFee, status: 'idle' } })
    expect(w.text()).toContain('Platform fee')
    expect(w.text()).toContain('PHP 5.00')
  })

  it('renders no fee rows when fees is empty', () => {
    const calcNoFees: OrderCalculation = {
      currency: 'PHP',
      items: [{ kind: 'ticket', label: 'GA', quantity: 1, unit_price: 100, amount: 100 }],
      subtotal: 100,
      fees: [],
      fees_total: 0,
      taxes: [],
      taxes_total: 0,
      total: 100,
    }
    const w = mount(OrderBreakdown, { props: { calculation: calcNoFees, status: 'idle' } })
    // No fee label text present beyond items
    expect(w.text()).not.toContain('fee')
    expect(w.text()).toContain('PHP 100.00')
  })
})
