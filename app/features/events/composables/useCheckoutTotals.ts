import { ref, type Ref } from 'vue'
import { eventsService } from '../services/events.service'
import type { OrderCalculation, RegisterPayload } from '../types'

export function useCheckoutTotals(slug: string, buildPayload: () => Pick<RegisterPayload, 'tickets' | 'checkout'>) {
  const calculation: Ref<OrderCalculation | null> = ref(null)
  const status = ref<'idle' | 'updating' | 'error'>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined
  let seq = 0

  function recalc(): void {
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
