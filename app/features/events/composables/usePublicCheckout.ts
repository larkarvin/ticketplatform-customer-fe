// Owns the checkout's client state: buyer, checkout-level answers, field errors,
// and the server-side price preview via useCheckoutTotals.
// Placement (pay / registerOrder) is deferred to a later slice — not wired to the UI here.
import { reactive, ref, type Ref } from 'vue'
import { validateCheckout } from '~/features/events/checkoutValidation'
import type { CartTicket, PublicEvent, RegisterPayload } from '~/features/events/types'
import { useCheckoutTotals } from './useCheckoutTotals'

export function usePublicCheckout(event: PublicEvent, cart: Ref<CartTicket[]>) {
  const buyer = reactive({ email: '', name: '', phone: '' })
  const checkoutAnswers = reactive<Record<string, unknown>>({})
  const fieldErrors = ref<Record<string, string>>({})

  function buildCalcPayload(): Pick<RegisterPayload, 'tickets' | 'checkout'> {
    return {
      tickets: cart.value.map((inst) => ({
        ticket_id: inst.ticket_id,
        quantity: 1,
        group_name: inst.group_name || undefined,
        participants: inst.participants.map((p) => ({ field_data: p.field_data })),
      })),
      checkout: { ...checkoutAnswers },
    }
  }

  const { calculation, status: totalsStatus, recalc: recalcTotals } = useCheckoutTotals(event.slug, buildCalcPayload)

  function validate(): boolean {
    fieldErrors.value = validateCheckout(event, cart.value, checkoutAnswers)
    return Object.keys(fieldErrors.value).length === 0
  }

  return { buyer, checkoutAnswers, fieldErrors, calculation, totalsStatus, recalcTotals, validate }
}
