import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { OrderCalculation } from '../../types'
import CheckoutPayBar from './CheckoutPayBar.vue'

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

describe('CheckoutPayBar', () => {
  it('renders the total amount when idle', () => {
    const calc = makeCalc({ total: 250 })
    const w = mount(CheckoutPayBar, { props: { calculation: calc, status: 'idle' } })
    expect(w.text()).toContain('PHP 250.00')
  })

  it('shows a dash when calculation is null and status is idle', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: null, status: 'idle' } })
    expect(w.text()).toContain('—')
  })

  it('shows "Payment coming soon" button that is always disabled', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: makeCalc(), status: 'idle' } })
    const btn = w.get('button[type=button]:not([data-retry])')
    expect(btn.text()).toContain('Payment coming soon')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows "Updating…" when status is updating', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: null, status: 'updating' } })
    expect(w.text()).toContain('Updating…')
    expect(w.text()).not.toContain('—')
  })

  it('shows error message and emits retry on click', async () => {
    const w = mount(CheckoutPayBar, { props: { calculation: makeCalc(), status: 'error' } })
    expect(w.text()).toContain("Couldn't update total")
    const retryBtn = w.get('[data-retry]')
    await retryBtn.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('hides error message when status is idle', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: makeCalc(), status: 'idle' } })
    expect(w.text()).not.toContain("Couldn't update total")
    expect(w.find('[data-retry]').exists()).toBe(false)
  })
})
