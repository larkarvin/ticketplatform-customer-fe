// Owns the checkout's client state: buyer, checkout-level answers, field errors,
// and the server-side price preview via useCheckoutTotals.
// placeAndPay orchestrates registration + payment initiation.
import { isValidationError } from '#core/errors'
import { reactive, ref, type Ref } from 'vue'
import { validateCheckout } from '~/features/events/checkoutValidation'
import { ordersService } from '~/features/events/services/orders.service'
import type { CartTicket, PublicEvent, RegisterPayload } from '~/features/events/types'
import { useCheckoutTotals } from './useCheckoutTotals'

export function usePublicCheckout(event: PublicEvent, cart: Ref<CartTicket[]>) {
  const buyer = reactive({ email: '', name: '', phone: '' })
  const checkoutAnswers = reactive<Record<string, unknown>>({})
  const fieldErrors = ref<Record<string, string>>({})
  const submitting = ref(false)
  const submitError = ref<string | null>(null)

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

  function buildRegisterPayload(): RegisterPayload {
    return {
      ...buildCalcPayload(),
      buyer: { email: buyer.email, name: buyer.name, phone: buyer.phone },
    }
  }

  const {
    calculation,
    status: totalsStatus,
    recalc: recalcTotals,
  } = useCheckoutTotals(event.slug, event.currency, buildCalcPayload)

  function validate(): boolean {
    fieldErrors.value = validateCheckout(event, cart.value)
    return Object.keys(fieldErrors.value).length === 0
  }

  async function placeAndPay(): Promise<void> {
    if (submitting.value) return
    if (!validate()) return
    submitting.value = true
    submitError.value = null
    try {
      const { order_number } = await ordersService.registerOrder(event.slug, buildRegisterPayload())
      const redirectUrl = `${window.location.origin}/orders/${order_number}`
      const { redirect_url } = await ordersService.initiatePayment(order_number, redirectUrl)
      if (redirect_url) {
        window.location.assign(redirect_url)
      } else {
        await navigateTo(`/orders/${order_number}`)
      }
    } catch (e) {
      submitting.value = false
      if (isValidationError(e)) {
        fieldErrors.value = e.fields
      } else {
        submitError.value = 'Something went wrong. Please try again.'
      }
    }
  }

  return {
    buyer,
    checkoutAnswers,
    fieldErrors,
    calculation,
    totalsStatus,
    recalcTotals,
    validate,
    submitting,
    submitError,
    placeAndPay,
  }
}
