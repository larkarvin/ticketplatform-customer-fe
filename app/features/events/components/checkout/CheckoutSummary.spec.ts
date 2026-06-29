import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { OrderCalculation } from '../../types'
import CheckoutSummary from './CheckoutSummary.vue'

function makeCalc(overrides: Partial<OrderCalculation> = {}): OrderCalculation {
  return {
    currency: 'PHP',
    items: [],
    subtotal: 100,
    fees: [],
    fees_total: 0,
    taxes: [],
    taxes_total: 0,
    total: 100,
    ...overrides,
  }
}

describe('CheckoutSummary', () => {
  it('renders the server total and each fee line', () => {
    const calc = makeCalc({
      fees: [{ label: 'Service fee', amount: 5 }],
      fees_total: 5,
      total: 105,
    })
    const w = mount(CheckoutSummary, { props: { calculation: calc, status: 'idle' } })
    expect(w.text()).toContain('Service fee')
    expect(w.text()).toContain('PHP 105.00')
  })

  it('renders each item line', () => {
    const calc = makeCalc({
      items: [{ kind: 'ticket', label: 'GA × 1', quantity: 1, unit_price: 100, amount: 100 }],
      subtotal: 100,
    })
    const w = mount(CheckoutSummary, { props: { calculation: calc, status: 'idle' } })
    expect(w.text()).toContain('GA × 1')
  })

  it('renders each tax line', () => {
    const calc = makeCalc({
      taxes: [{ label: 'VAT 12%', amount: 12 }],
      taxes_total: 12,
      total: 112,
    })
    const w = mount(CheckoutSummary, { props: { calculation: calc, status: 'idle' } })
    expect(w.text()).toContain('VAT 12%')
  })

  it('shows Updating with the CTA disabled while recalculating', () => {
    const w = mount(CheckoutSummary, { props: { calculation: null, status: 'updating' } })
    expect(w.text()).toContain('Updating')
    expect(w.get('button[type=button]').attributes('disabled')).toBeDefined()
  })

  it('CTA is always disabled (payment coming soon)', () => {
    const calc = makeCalc({ total: 105 })
    const w = mount(CheckoutSummary, { props: { calculation: calc, status: 'idle' } })
    const btn = w.get('button[type=button]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Payment coming soon')
  })

  it('shows a retry row and emits retry on error', async () => {
    const w = mount(CheckoutSummary, { props: { calculation: null, status: 'error' } })
    expect(w.text()).toContain("Couldn't update total")
    const retryBtn = w.find('[data-retry]')
    await retryBtn.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('shows a dash for total when calculation is null and not updating', () => {
    const w = mount(CheckoutSummary, { props: { calculation: null, status: 'idle' } })
    expect(w.text()).toContain('—')
  })
})
