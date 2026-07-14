// customer-fe/app/features/recovery/components/RecoveryList.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { RecoveryItem } from '../types'
import RecoveryList from './RecoveryList.vue'

const stubs = { ClientOnly: { template: '<div><slot /></div>' } }

function item(overrides: Partial<RecoveryItem> = {}): RecoveryItem {
  return {
    type: 'order',
    title: 'Spring Gala',
    reference: '1042',
    status: 'paid',
    url: 'https://example.test/orders/abc',
    created_at: null,
    ...overrides,
  }
}

describe('RecoveryList', () => {
  it('renders one card per item', () => {
    const items = [item(), item({ type: 'submission', reference: '', status: 'submitted', url: 'https://x/y/edit' })]
    const w = mount(RecoveryList, { props: { items }, global: { stubs } })
    expect(w.findAll('li')).toHaveLength(2)
    expect(w.findAll('a').map((a) => a.attributes('href'))).toEqual([
      'https://example.test/orders/abc',
      'https://x/y/edit',
    ])
  })

  it('states plainly that nothing was found — this view is only reachable with a valid token, so unlike the "sent" step it really did look', () => {
    const w = mount(RecoveryList, { props: { items: [] }, global: { stubs } })
    expect(w.text()).toContain("We couldn't find anything for that address")
    expect(w.findAll('li')).toHaveLength(0)
  })
})
