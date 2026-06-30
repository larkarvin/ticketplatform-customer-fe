import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventsService } from '../services/events.service'
import { useCheckoutTotals } from './useCheckoutTotals'

vi.mock('../services/events.service', () => ({ eventsService: { calculateOrder: vi.fn() } }))
const calc = vi.mocked(eventsService.calculateOrder)
// A non-empty payload so recalc actually calls the server (an empty order short-circuits to zero).
const payload = () => ({ tickets: [{ ticket_id: 9, quantity: 1, participants: [{ field_data: {} }] }], checkout: {} })
const emptyPayload = () => ({ tickets: [], checkout: {} })

describe('useCheckoutTotals', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('debounces and stores the server calculation', async () => {
    calc.mockResolvedValue({
      currency: 'PHP',
      items: [],
      subtotal: 200,
      fees: [],
      fees_total: 0,
      taxes: [],
      taxes_total: 0,
      total: 200,
    })
    const t = useCheckoutTotals('hearts-run', 'PHP', payload)
    t.recalc()
    t.recalc() // collapse to one call
    expect(t.status.value).toBe('updating')
    await vi.runAllTimersAsync()
    expect(calc).toHaveBeenCalledTimes(1)
    expect(t.calculation.value?.total).toBe(200)
    expect(t.status.value).toBe('idle')
  })

  it('keeps last calculation and flips to error on failure', async () => {
    calc.mockRejectedValueOnce(new Error('network'))
    const t = useCheckoutTotals('hearts-run', 'PHP', payload)
    t.recalc()
    await vi.runAllTimersAsync()
    expect(t.status.value).toBe('error')
  })

  it('an empty order resolves to a zero total without calling the server', async () => {
    const t = useCheckoutTotals('hearts-run', 'USD', emptyPayload)
    t.recalc()
    expect(t.calculation.value?.total).toBe(0)
    expect(t.calculation.value?.currency).toBe('USD')
    expect(t.status.value).toBe('idle')
    await vi.runAllTimersAsync()
    expect(calc).not.toHaveBeenCalled()
  })

  it('treats a cartless order whose only extras are false/0 as empty (no 422)', async () => {
    // Regression: false (unchecked box) and 0 (zero donation) must not count as answered extras, or the
    // empty-order guard is defeated and an empty tickets list hits the backend 422.
    const t = useCheckoutTotals('hearts-run', 'USD', () => ({ tickets: [], checkout: { consent: false, tip: 0 } }))
    t.recalc()
    expect(t.calculation.value?.total).toBe(0)
    expect(t.status.value).toBe('idle')
    await vi.runAllTimersAsync()
    expect(calc).not.toHaveBeenCalled()
  })

  it('clearing the cart resets a stale total to zero and clears the error state', async () => {
    // Reproduces the bug: a prior total of 50, then everything removed → must show 0, not "error" + 50.
    calc.mockRejectedValue(new Error('422'))
    let empty = false
    const t = useCheckoutTotals('hearts-run', 'USD', () => (empty ? emptyPayload() : payload()))
    t.calculation.value = {
      currency: 'USD',
      items: [],
      subtotal: 50,
      fees: [],
      fees_total: 0,
      taxes: [],
      taxes_total: 0,
      total: 50,
    }
    empty = true
    t.recalc()
    expect(t.calculation.value.total).toBe(0)
    expect(t.status.value).toBe('idle')
  })
})
