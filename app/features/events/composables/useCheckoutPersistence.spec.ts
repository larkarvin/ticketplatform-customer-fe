import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CheckoutDraft } from './useCheckoutPersistence'
import { useCheckoutPersistence } from './useCheckoutPersistence'

const SLUG = 'test-event'
const KEY = `checkout:${SLUG}`

const DRAFT: CheckoutDraft = {
  tickets: [
    {
      uid: 'abc-1',
      ticket_id: 42,
      group_name: 'Team Alpha',
      participants: [{ field_data: { name: 'Alice', age: 30 } }],
    },
  ],
  checkoutAnswers: { dietary: 'vegan', t_shirt: 'L' },
  email: 'alice@example.com',
}

describe('useCheckoutPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('restore() returns null when key is absent', () => {
    const { restore } = useCheckoutPersistence(SLUG)
    expect(restore()).toBeNull()
  })

  it('save() then restore() round-trips tickets, answers, and email', () => {
    const { save, restore } = useCheckoutPersistence(SLUG)
    save(DRAFT)
    vi.runAllTimers()
    expect(restore()).toEqual(DRAFT)
  })

  it('clear() removes the key so restore() returns null', () => {
    const { save, restore, clear } = useCheckoutPersistence(SLUG)
    save(DRAFT)
    vi.runAllTimers()
    clear()
    expect(restore()).toBeNull()
  })

  it('restore() returns null (no throw) on corrupt JSON', () => {
    localStorage.setItem(KEY, '{ broken json :::')
    const { restore } = useCheckoutPersistence(SLUG)
    expect(() => restore()).not.toThrow()
    expect(restore()).toBeNull()
  })

  it('restore() returns null on structurally invalid JSON (not a draft shape)', () => {
    localStorage.setItem(KEY, JSON.stringify({ foo: 'bar' }))
    const { restore } = useCheckoutPersistence(SLUG)
    expect(restore()).toBeNull()
  })

  it('save() debounces — multiple calls within the window produce one write', () => {
    const { save, restore } = useCheckoutPersistence(SLUG)

    save({ ...DRAFT, email: 'first@example.com' })
    save({ ...DRAFT, email: 'second@example.com' })
    save({ ...DRAFT, email: 'third@example.com' })

    // Timer hasn't fired yet — key should not exist yet
    expect(localStorage.getItem(KEY)).toBeNull()

    vi.runAllTimers()

    // Exactly one write with the last value
    const written = restore()
    expect(written).not.toBeNull()
    expect(written!.email).toBe('third@example.com')
    // Confirm only one item stored under this key (no intermediate writes)
    expect(localStorage.length).toBe(1)
  })

  it('clear() cancels a pending debounced save', () => {
    const { save, clear, restore } = useCheckoutPersistence(SLUG)
    save(DRAFT)
    clear() // cancels the pending write
    vi.runAllTimers()
    expect(restore()).toBeNull()
  })
})
