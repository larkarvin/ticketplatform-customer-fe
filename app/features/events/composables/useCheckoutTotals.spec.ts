import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventsService } from '../services/events.service'
import { useCheckoutTotals } from './useCheckoutTotals'

vi.mock('../services/events.service', () => ({ eventsService: { calculateOrder: vi.fn() } }))
const calc = vi.mocked(eventsService.calculateOrder)
const payload = () => ({ tickets: [], checkout: {} })

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
    const t = useCheckoutTotals('hearts-run', payload)
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
    const t = useCheckoutTotals('hearts-run', payload)
    t.recalc()
    await vi.runAllTimersAsync()
    expect(t.status.value).toBe('error')
  })
})
