// Owns the checkout's client state: buyer, checkout-level answers, field errors,
// and the server-side price preview via useCheckoutTotals.
// placeAndPay orchestrates registration + payment initiation.
import { isValidationError } from '#core/errors'
import { reactive, ref, watch, type Ref } from 'vue'
import { validateCheckout } from '~/features/events/checkoutValidation'
import { ordersService } from '~/features/events/services/orders.service'
import type { CartTicket, PublicEvent, RegisterPayload } from '~/features/events/types'
import { useCheckoutPersistence } from './useCheckoutPersistence'
import { useCheckoutTotals } from './useCheckoutTotals'

export function usePublicCheckout(event: PublicEvent, cart: Ref<CartTicket[]>) {
  const buyer = reactive({ email: '', name: '', phone: '' })
  const checkoutAnswers = reactive<Record<string, unknown>>({})
  const fieldErrors = ref<Record<string, string>>({})
  const submitting = ref(false)
  const submitError = ref<string | null>(null)
  // Caches the order's public_id once registerOrder succeeds, so a retry after a post-register
  // failure (e.g. initiatePayment throws) reuses the same order instead of placing a
  // duplicate reservation. Cleared when the cart selection changes (editing the cart must
  // force a fresh order).
  const placedOrderPublicId = ref<string | null>(null)

  // Reset the cached order whenever the cart selection changes — a different cart is a
  // different order. Deep watch so quantity/instance edits are caught.
  watch(
    cart,
    () => {
      placedOrderPublicId.value = null
    },
    { deep: true }
  )

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

  function buyerEmailError(email: string): string | null {
    const trimmed = email.trim()
    if (!trimmed) return 'Please enter your email so we can send your receipt.'
    if (!/.+@.+\..+/.test(trimmed)) return 'Please enter a valid email address.'
    return null
  }

  function validate(): boolean {
    fieldErrors.value = validateCheckout(event, cart.value)
    return Object.keys(fieldErrors.value).length === 0
  }

  async function placeAndPay(): Promise<void> {
    if (submitting.value) return
    if (!validate()) return
    const emailError = buyerEmailError(buyer.email)
    if (emailError) {
      fieldErrors.value = { ...fieldErrors.value, 'buyer.email': emailError }
      return
    }
    submitting.value = true
    submitError.value = null
    try {
      // Reuse the already-placed order on retry; only register when none exists yet.
      if (placedOrderPublicId.value === null) {
        const { public_id } = await ordersService.registerOrder(event.slug, buildRegisterPayload())
        placedOrderPublicId.value = public_id
      }
      const publicId = placedOrderPublicId.value
      const redirectUrl = `${window.location.origin}/orders/${publicId}`
      const { redirect_url } = await ordersService.initiatePayment(publicId, redirectUrl)
      // Success — clear the persisted draft so a stale draft can't resurface on a later visit.
      useCheckoutPersistence(event.slug).clear()
      if (redirect_url) {
        window.location.assign(redirect_url)
      } else {
        await navigateTo(`/orders/${publicId}`)
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
