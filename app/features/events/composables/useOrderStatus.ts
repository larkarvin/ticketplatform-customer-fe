/**
 * useOrderStatus — polls payment status + derives UI state + holds expiry countdown.
 *
 * State mapping (server status → UI state):
 *   paid                              → 'paid'       (terminal)
 *   failed | declined | error |       → 'failed'     (terminal — treated as failed for UI
 *     canceled | cancelled                            purposes; canceled/cancelled = both spellings)
 *   expired                           → 'expired'    (terminal)
 *   processing                        → 'processing' (non-terminal, polls until terminal)
 *   pending | abandoned |             → 'awaiting'   (non-terminal, still resumable, keeps polling)
 *     no_payment_attempt |
 *     missing_transaction_reference |
 *     <unknown>
 *
 * Terminal states stop polling. A future expires_at ticks secondsLeft down each second;
 * reaching 0 while in a non-terminal state flips to 'expired' and stops everything.
 *
 * SSR-safe: timers are never started at module scope; they start only via import.meta.client
 * guards and are cleaned up via onScopeDispose.
 */
import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'
import { ordersService } from '../services/orders.service'

export type OrderStatusState = 'processing' | 'paid' | 'awaiting' | 'failed' | 'expired'

const POLL_INTERVAL_MS = 2_000
const COUNTDOWN_INTERVAL_MS = 1_000

const TERMINAL: ReadonlySet<OrderStatusState> = new Set(['paid', 'failed', 'expired'])

function mapStatus(serverStatus: string): OrderStatusState {
  switch (serverStatus) {
    case 'paid':
      return 'paid'
    case 'failed':
    case 'declined':
    case 'error':
    case 'canceled':
    case 'cancelled':
      return 'failed'
    case 'expired':
      return 'expired'
    case 'processing':
      return 'processing'
    case 'pending':
    default:
      return 'awaiting'
  }
}

function secondsUntil(isoString: string | null): number | null {
  if (!isoString) return null
  const diff = Math.floor((new Date(isoString).getTime() - Date.now()) / 1_000)
  return Math.max(0, diff)
}

export interface UseOrderStatusOptions {
  status: string
  expires_at: string | null
}

export function useOrderStatus(
  publicId: string,
  initial: UseOrderStatusOptions
): {
  state: Ref<OrderStatusState>
  secondsLeft: Ref<number | null>
  refresh: () => Promise<void>
  stop: () => void
} {
  const state = ref<OrderStatusState>(mapStatus(initial.status))
  const secondsLeft = ref<number | null>(secondsUntil(initial.expires_at))

  let pollTimer: ReturnType<typeof setInterval> | undefined
  let countdownTimer: ReturnType<typeof setInterval> | undefined

  function clearTimers(): void {
    if (pollTimer !== undefined) {
      clearInterval(pollTimer)
      pollTimer = undefined
    }
    if (countdownTimer !== undefined) {
      clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }

  function stop(): void {
    clearTimers()
  }

  function startCountdown(expiresAt: string | null): void {
    if (!expiresAt) return
    if (countdownTimer !== undefined) clearInterval(countdownTimer)

    countdownTimer = setInterval(() => {
      const secs = secondsUntil(expiresAt)
      secondsLeft.value = secs

      if (secs === 0 && !TERMINAL.has(state.value)) {
        state.value = 'expired'
        clearTimers()
      }
    }, COUNTDOWN_INTERVAL_MS)
  }

  async function doPoll(): Promise<void> {
    try {
      const response = await ordersService.paymentStatus(publicId)
      // Guard: if the state became terminal while this request was in-flight (e.g. countdown
      // expired or stop() was called), discard the late response — never clobber terminal state.
      if (TERMINAL.has(state.value)) return
      const mapped = mapStatus(response.status)
      state.value = mapped
      if (TERMINAL.has(mapped)) {
        clearTimers()
      }
    } catch {
      // Keep last state on error — do not blank
    }
  }

  async function refresh(): Promise<void> {
    await doPoll()
  }

  function startPolling(): void {
    if (TERMINAL.has(state.value)) return
    if (pollTimer !== undefined) clearInterval(pollTimer)
    pollTimer = setInterval(() => {
      void doPoll()
    }, POLL_INTERVAL_MS)
  }

  // Start timers — SSR-safe: only when a DOM is available (window exists = browser or jsdom).
  // import.meta.client would also work in production Nuxt but evaluates to false in Vitest's
  // jsdom environment, so we use the typeof window guard instead.
  if (typeof window !== 'undefined') {
    startPolling()
    startCountdown(initial.expires_at)
  }

  // onScopeDispose requires an active Vue effect scope. Guard so unit tests calling the
  // composable outside a component/effectScope don't trigger a Vue warning.
  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearTimers()
    })
  }

  return { state, secondsLeft, refresh, stop }
}
