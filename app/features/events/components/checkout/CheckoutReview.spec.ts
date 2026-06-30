// app/features/events/components/checkout/CheckoutReview.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import type { ReviewGroup } from '~/core/types/review'
import CheckoutReview from './CheckoutReview.vue'

const groups: ReviewGroup[] = [
  { editTarget: 0, title: "Who's coming", items: [{ key: 'u1.0', label: 'GA · #1', value: 'Juan' }] },
]
const calc = { currency: 'PHP', items: [], subtotal: 0, fees: [], fees_total: 0, taxes: [], taxes_total: 0, total: 0 }

describe('CheckoutReview', () => {
  it('renders the read-back and re-emits edit', async () => {
    const w = mount(CheckoutReview, {
      props: { groups, calculation: calc, status: 'idle', buyer: reactive({ email: '' }) },
    })
    expect(w.text()).toContain("Who's coming")
    await w.get('button').trigger('click') // ReviewSummary Edit
    expect(w.emitted('edit')?.[0]).toEqual([0])
  })

  it('shows the email as confirmed text with a Change toggle once filled', async () => {
    const buyer = reactive({ email: 'juan@email.com' })
    const w = mount(CheckoutReview, { props: { groups, calculation: calc, status: 'idle', buyer } })
    expect(w.text()).toContain('juan@email.com')
    expect(w.find('input[type="email"]').exists()).toBe(false)
    await w.get('[data-test="change-email"]').trigger('click')
    expect(w.find('input[type="email"]').exists()).toBe(true)
  })
})
