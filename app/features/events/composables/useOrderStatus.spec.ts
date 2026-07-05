import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ordersService } from '../services/orders.service'
import { useOrderStatus } from './useOrderStatus'

vi.mock('../services/orders.service', () => ({
  ordersService: { paymentStatus: vi.fn() },
}))
const mockPaymentStatus = vi.mocked(ordersService.paymentStatus)

const POLL_MS = 10_000
const TICK_MS = 1_000

function expiresAt(secondsFromNow: number): string {
  return new Date(Date.now() + secondsFromNow * 1_000).toISOString()
}

describe('useOrderStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('maps pending + future expires_at → awaiting with secondsLeft counting down', async () => {
    const { state, secondsLeft } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(60),
    })

    expect(state.value).toBe('awaiting')
    expect(secondsLeft.value).toBeCloseTo(60, -1)

    // Advance 10 seconds — countdown ticks down (within ±2 of 50)
    await vi.advanceTimersByTimeAsync(10 * TICK_MS)
    expect(secondsLeft.value).toBeGreaterThanOrEqual(48)
    expect(secondsLeft.value).toBeLessThanOrEqual(52)
  })

  it('maps paid → paid immediately, processing → processing', () => {
    const { state: paidState } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'paid',
      expires_at: null,
    })
    expect(paidState.value).toBe('paid')

    const { state: processingState } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'processing',
      expires_at: null,
    })
    expect(processingState.value).toBe('processing')
  })

  it('maps failed → failed', () => {
    const { state: f } = useOrderStatus('11111111-1111-4111-8111-111111111111', { status: 'failed', expires_at: null })
    expect(f.value).toBe('failed')
  })

  it("maps 'cancelled' to its own terminal state", () => {
    const { state } = useOrderStatus('p1', { status: 'cancelled', expires_at: null })
    expect(state.value).toBe('cancelled')
  })

  it('maps declined + error → failed', () => {
    const { state: d } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'declined',
      expires_at: null,
    })
    expect(d.value).toBe('failed')

    const { state: e } = useOrderStatus('11111111-1111-4111-8111-111111111111', { status: 'error', expires_at: null })
    expect(e.value).toBe('failed')
  })

  it('maps canceled (American single-l) → cancelled', () => {
    const { state: c } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'canceled',
      expires_at: null,
    })
    expect(c.value).toBe('cancelled')
  })

  it('maps expired → expired immediately', () => {
    const { state } = useOrderStatus('11111111-1111-4111-8111-111111111111', { status: 'expired', expires_at: null })
    expect(state.value).toBe('expired')
  })

  it('flips to expired when expires_at is in the past', async () => {
    const { state } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(-5), // already past
    })

    // On the first countdown tick it should detect expiry
    await vi.advanceTimersByTimeAsync(TICK_MS)
    expect(state.value).toBe('expired')
  })

  it('poll returns paid → state becomes paid and polling stops', async () => {
    mockPaymentStatus.mockResolvedValue({ success: true, status: 'paid' })

    const { state } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(300),
    })

    // Before any poll
    expect(state.value).toBe('awaiting')

    // Advance past one poll interval
    await vi.advanceTimersByTimeAsync(POLL_MS + 100)
    expect(state.value).toBe('paid')

    // Confirm polling stopped — no more calls after the terminal state
    const callsAfterPaid = mockPaymentStatus.mock.calls.length
    await vi.advanceTimersByTimeAsync(POLL_MS * 3)
    expect(mockPaymentStatus).toHaveBeenCalledTimes(callsAfterPaid)
  })

  it('poll error keeps the last good state (no blanking)', async () => {
    mockPaymentStatus.mockRejectedValue(new Error('network'))

    const { state } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(300),
    })

    expect(state.value).toBe('awaiting')

    await vi.advanceTimersByTimeAsync(POLL_MS + 100)

    // State must still be awaiting — error must not blank it
    expect(state.value).toBe('awaiting')
  })

  it('countdown reaches 0 while pending → flips to expired and stops polling', async () => {
    mockPaymentStatus.mockResolvedValue({ success: true, status: 'pending' })

    const { state, secondsLeft } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(3),
    })

    expect(state.value).toBe('awaiting')

    // Advance 4 seconds so expiry has passed
    await vi.advanceTimersByTimeAsync(4 * TICK_MS)
    expect(state.value).toBe('expired')
    expect(secondsLeft.value).toBe(0)
  })

  it('refresh() triggers an immediate poll', async () => {
    mockPaymentStatus.mockResolvedValue({ success: true, status: 'pending' })

    const { refresh } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(300),
    })

    expect(mockPaymentStatus).not.toHaveBeenCalled()
    await refresh()
    expect(mockPaymentStatus).toHaveBeenCalledTimes(1)
  })

  it('stop() clears timers so no further polls occur', async () => {
    mockPaymentStatus.mockResolvedValue({ success: true, status: 'pending' })

    const { stop } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(300),
    })

    stop()
    await vi.advanceTimersByTimeAsync(POLL_MS * 5)
    expect(mockPaymentStatus).not.toHaveBeenCalled()
  })

  it('late in-flight poll does not clobber expired state (race guard)', async () => {
    // Hold the poll response until we manually resolve it to simulate a slow network call.
    let resolveDeferred!: (value: { success: boolean; status: string }) => void
    const deferred = new Promise<{ success: boolean; status: string }>((res) => {
      resolveDeferred = res
    })
    mockPaymentStatus.mockReturnValue(deferred)

    // expires 15s out — enough headroom to trigger a poll (t=10s) before the countdown (t=15s).
    const { state } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'pending',
      expires_at: expiresAt(15),
    })

    expect(state.value).toBe('awaiting')

    // Advance past the first poll interval (t=10s) so doPoll() is in-flight.
    // Countdown has ticked ~10 times (secondsLeft ~5); state still 'awaiting'.
    await vi.advanceTimersByTimeAsync(POLL_MS + 100)
    expect(state.value).toBe('awaiting') // poll hasn't resolved yet

    // Advance the remaining ~5 s so the countdown reaches 0 → state flips to 'expired'.
    await vi.advanceTimersByTimeAsync(5 * TICK_MS)
    expect(state.value).toBe('expired')

    // NOW let the stale in-flight poll resolve with 'pending' (would map to 'awaiting').
    resolveDeferred({ success: true, status: 'pending' })
    await Promise.resolve() // flush the microtask queue

    // The terminal guard must discard the late response — state stays 'expired'.
    expect(state.value).toBe('expired')
  })

  it('refresh() after terminal state does not change state', async () => {
    mockPaymentStatus.mockResolvedValue({ success: true, status: 'pending' })

    const { state, refresh } = useOrderStatus('11111111-1111-4111-8111-111111111111', {
      status: 'paid',
      expires_at: null,
    })

    expect(state.value).toBe('paid')

    // refresh() calls doPoll() but the terminal guard should discard the response
    await refresh()

    expect(state.value).toBe('paid')
    expect(mockPaymentStatus).toHaveBeenCalledTimes(1)
  })
})
