import { ref, type Ref } from 'vue'
import { eventsService } from '../services/events.service'
import type { OrderCalculation, RegisterPayload } from '../types'

type CalcPayload = Pick<RegisterPayload, 'tickets' | 'checkout'>

function hasAnswer(v: unknown): boolean {
  return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== ''
}

/** An order with no tickets and no answered extras has nothing to price — its total is simply zero. */
function isEmptyPayload(p: CalcPayload): boolean {
  return p.tickets.length === 0 && !Object.values(p.checkout).some(hasAnswer)
}

function zeroCalculation(currency: string): OrderCalculation {
  return { currency, items: [], subtotal: 0, fees: [], fees_total: 0, taxes: [], taxes_total: 0, total: 0 }
}

export function useCheckoutTotals(slug: string, currency: string, buildPayload: () => CalcPayload) {
  const calculation: Ref<OrderCalculation | null> = ref(null)
  const status = ref<'idle' | 'updating' | 'error'>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined
  let seq = 0

  function recalc(): void {
    // Empty order → resolve to zero locally. The backend rejects an empty tickets list (422), which
    // would otherwise surface as "Couldn't update total" while a stale prior total lingers.
    if (isEmptyPayload(buildPayload())) {
      if (timer) clearTimeout(timer)
      seq++ // invalidate any in-flight request so it can't overwrite the zero
      calculation.value = zeroCalculation(currency)
      status.value = 'idle'
      return
    }
    status.value = 'updating'
    if (timer) clearTimeout(timer)
    timer = setTimeout(async () => {
      const id = ++seq
      try {
        const result = await eventsService.calculateOrder(slug, buildPayload())
        if (id !== seq) return // a newer recalc superseded this one
        calculation.value = result
        status.value = 'idle'
      } catch {
        if (id !== seq) return
        status.value = 'error' // keep last calculation.value
      }
    }, 350)
  }

  return { calculation, status, recalc }
}
