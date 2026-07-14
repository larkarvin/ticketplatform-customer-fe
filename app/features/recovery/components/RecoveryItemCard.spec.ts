// customer-fe/app/features/recovery/components/RecoveryItemCard.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { RecoveryItem } from '../types'
import RecoveryItemCard from './RecoveryItemCard.vue'

function item(overrides: Partial<RecoveryItem> = {}): RecoveryItem {
  return {
    type: 'order',
    title: 'Spring Gala',
    reference: '1042',
    status: 'paid',
    url: 'https://example.test/orders/abc?signature=x',
    created_at: '2026-04-05T10:00:00Z',
    ...overrides,
  }
}

// The card renders the date inside <ClientOnly> (local-timezone formatting must not run on the server);
// outside Nuxt that component doesn't exist, so stub it to its slot.
const stubs = { ClientOnly: { template: '<div><slot /></div>' } }

function card(overrides: Partial<RecoveryItem> = {}) {
  return mount(RecoveryItemCard, { props: { item: item(overrides) }, global: { stubs } })
}

describe('RecoveryItemCard', () => {
  it('links straight to the API-supplied url, which already authorizes itself', () => {
    // The signed pay URL / submission edit link IS the credential — the card must not rebuild a route.
    expect(card().find('a').attributes('href')).toBe('https://example.test/orders/abc?signature=x')
  })

  it('names the unfinished job on an unpaid order rather than a vague "view"', () => {
    expect(card({ status: 'pending' }).text()).toContain('Finish payment')
    expect(card({ status: 'failed' }).text()).toContain('Finish payment')
  })

  it('offers to view a paid order, and to update a submission', () => {
    expect(card({ status: 'paid' }).text()).toContain('View my order')
    expect(card({ type: 'submission', reference: '', status: 'submitted' }).text()).toContain('Update my answers')
  })

  it('shows the order reference, and never a bare "#" for a submission (which carries none)', () => {
    expect(card().text()).toContain('Order #1042')
    expect(card({ type: 'submission', reference: '', status: 'submitted' }).text()).not.toContain('Order #')
  })

  it('renders the title from `title` — the org name would be the silent fallback if this broke', () => {
    expect(card({ title: 'Parish Raffle' }).text()).toContain('Parish Raffle')
  })

  it('omits the date entirely when created_at is null — never "Invalid Date"', () => {
    const w = card({ created_at: null })
    expect(w.text()).not.toContain('Invalid Date')
    expect(w.text()).not.toContain('Ordered')
  })

  it('omits the date on an unparseable timestamp too', () => {
    const w = card({ created_at: 'not-a-date' })
    expect(w.text()).not.toContain('Invalid Date')
    expect(w.text()).not.toContain('Ordered')
  })

  it('translates the status into plain English', () => {
    expect(card({ status: 'pending' }).text()).toContain('Not paid yet')
    expect(card({ status: 'cancelled' }).text()).toContain('Cancelled')
  })

  it('shows no badge for a status we have no wording for, rather than a raw machine word', () => {
    const w = card({ status: 'chargeback' })
    expect(w.text()).not.toContain('chargeback')
    expect(w.text()).not.toContain('recovery.status')
  })
})
