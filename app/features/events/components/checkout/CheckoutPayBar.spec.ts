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
    const w = mount(CheckoutPayBar, { props: { calculation: calc, status: 'idle', mode: 'review' } })
    expect(w.text()).toContain('PHP 250.00')
  })

  it('shows a dash when calculation is null and status is idle', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: null, status: 'idle', mode: 'review' } })
    expect(w.text()).toContain('—')
  })

  it('review mode with a calculation renders Pay <total> button', () => {
    const w = mount(CheckoutPayBar, {
      props: { calculation: makeCalc({ total: 100 }), status: 'idle', mode: 'review' },
    })
    const btn = w.get('[data-test="pay"]')
    expect(btn.text()).toContain('Pay PHP 100.00')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('clicking the Pay button emits pay', async () => {
    const w = mount(CheckoutPayBar, { props: { calculation: makeCalc(), status: 'idle', mode: 'review' } })
    await w.get('[data-test="pay"]').trigger('click')
    expect(w.emitted('pay')).toHaveLength(1)
  })

  it('submitting=true disables the Pay button and shows loading label', () => {
    const w = mount(CheckoutPayBar, {
      props: { calculation: makeCalc(), status: 'idle', mode: 'review', submitting: true },
    })
    const btn = w.get('[data-test="pay"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Taking you to secure payment…')
  })

  it('status===updating disables the Pay button', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: makeCalc(), status: 'updating', mode: 'review' } })
    expect(w.get('[data-test="pay"]').attributes('disabled')).toBeDefined()
  })

  it('shows "Updating…" when status is updating', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: null, status: 'updating', mode: 'review' } })
    expect(w.text()).toContain('Updating…')
    expect(w.text()).not.toContain('—')
  })

  it('shows error message and emits retry on click', async () => {
    const w = mount(CheckoutPayBar, { props: { calculation: makeCalc(), status: 'error', mode: 'review' } })
    expect(w.text()).toContain("Couldn't update total")
    const retryBtn = w.get('[data-retry]')
    await retryBtn.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('hides error message when status is idle', () => {
    const w = mount(CheckoutPayBar, { props: { calculation: makeCalc(), status: 'idle', mode: 'review' } })
    expect(w.text()).not.toContain("Couldn't update total")
    expect(w.find('[data-retry]').exists()).toBe(false)
  })
})

describe('CheckoutPayBar mode', () => {
  const calc = { currency: 'PHP', items: [], subtotal: 0, fees: [], fees_total: 0, taxes: [], taxes_total: 0, total: 0 }

  it('emits continue from the entry CTA', async () => {
    const w = mount(CheckoutPayBar, { props: { calculation: calc, status: 'idle', mode: 'entry' } })
    await w.get('[data-test="continue"]').trigger('click')
    expect(w.emitted('continue')).toHaveLength(1)
  })

  it('disables the entry Continue button when continueDisabled', () => {
    const w = mount(CheckoutPayBar, {
      props: { calculation: calc, status: 'idle', mode: 'entry', continueDisabled: true },
    })
    expect(w.get('[data-test="continue"]').attributes('disabled')).toBeDefined()
  })

  it('emits back from the review bar', async () => {
    const w = mount(CheckoutPayBar, { props: { calculation: calc, status: 'idle', mode: 'review' } })
    await w.get('[data-test="back"]').trigger('click')
    expect(w.emitted('back')).toHaveLength(1)
  })
})
