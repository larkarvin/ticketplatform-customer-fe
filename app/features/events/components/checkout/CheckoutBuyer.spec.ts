import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CheckoutBuyer from './CheckoutBuyer.vue'

function makeBuyer(overrides: Partial<{ email: string; name?: string }> = {}) {
  return { email: '', ...overrides }
}

describe('CheckoutBuyer', () => {
  it('renders the email label', () => {
    const w = mount(CheckoutBuyer, { props: { buyer: makeBuyer() } })
    expect(w.text()).toContain('Email address')
  })

  it('renders an email input', () => {
    const w = mount(CheckoutBuyer, { props: { buyer: makeBuyer() } })
    const input = w.find('input[type="email"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('autocomplete')).toBe('email')
  })

  it('does NOT render a name field', () => {
    const w = mount(CheckoutBuyer, { props: { buyer: makeBuyer() } })
    expect(w.find('input[type="text"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Name')
  })

  it('reflects the buyer email value in the input', () => {
    const w = mount(CheckoutBuyer, { props: { buyer: makeBuyer({ email: 'test@example.com' }) } })
    const input = w.find<HTMLInputElement>('input[type="email"]')
    expect(input.element.value).toBe('test@example.com')
  })

  it('updates buyer.email via setter on input', async () => {
    const buyer = makeBuyer()
    const w = mount(CheckoutBuyer, { props: { buyer } })
    const input = w.find<HTMLInputElement>('input[type="email"]')
    await input.setValue('hello@example.com')
    expect(buyer.email).toBe('hello@example.com')
  })

  it('has a visible "Your details" heading', () => {
    const w = mount(CheckoutBuyer, { props: { buyer: makeBuyer() } })
    expect(w.text()).toContain('Your details')
  })

  it('has the confirmation helper text', () => {
    const w = mount(CheckoutBuyer, { props: { buyer: makeBuyer() } })
    expect(w.text()).toContain('confirmation')
  })
})
