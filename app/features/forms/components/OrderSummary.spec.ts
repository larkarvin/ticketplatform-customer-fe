import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { PaymentBreakdown } from '~/features/forms/types'
import OrderSummary from './OrderSummary.vue'

function breakdown(overrides: Partial<PaymentBreakdown> = {}): PaymentBreakdown {
  return {
    currency: 'PHP',
    items: [],
    fees: [],
    subtotal: 0,
    fees_total: 0,
    total: 0,
    ...overrides,
  }
}

describe('OrderSummary', () => {
  it('renders a line name from the canonical `label` key (base price)', () => {
    // The preview engine sends every line with a `label` (e.g. "Base price") and no *_label/product_name.
    const w = mount(OrderSummary, {
      props: {
        breakdown: breakdown({
          items: [{ label: 'Base price', quantity: 1, unit_price: 50, amount: 50 }],
          subtotal: 50,
          total: 50,
        }),
      },
    })
    expect(w.text()).toContain('Base price')
    expect(w.text()).toContain('PHP 50.00')
  })

  it('prefers the richer product/option labels when present', () => {
    const w = mount(OrderSummary, {
      props: {
        breakdown: breakdown({
          items: [
            {
              label: 'ignored',
              product_name: 'T-shirt',
              option_label: 'Large',
              quantity: 2,
              unit_price: 10,
              amount: 20,
            },
          ],
          subtotal: 20,
          total: 20,
        }),
      },
    })
    expect(w.text()).toContain('T-shirt')
    expect(w.text()).toContain('Large')
    expect(w.text()).not.toContain('ignored')
  })
})
