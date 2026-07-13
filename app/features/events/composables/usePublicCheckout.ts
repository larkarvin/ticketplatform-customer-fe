// Owns the checkout's client state: buyer, checkout-level answers, field errors,
// and the server-side price preview via useCheckoutTotals.
// placeAndPay orchestrates registration + payment initiation.
import { isValidationError } from '#core/errors'
import { useT } from '#core/i18n'
import { reactive, ref, watch, type Ref } from 'vue'
import { validateCheckout } from '~/features/events/checkoutValidation'
import { ordersService } from '~/features/events/services/orders.service'
import type { CartTicket, PublicEvent, RegisterPayload } from '~/features/events/types'
import { useCheckoutPersistence } from './useCheckoutPersistence'
import { useCheckoutTotals } from './useCheckoutTotals'

export function usePublicCheckout(event: PublicEvent, cart: Ref<CartTicket[]>) {
  const { t } = useT()

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
    // Collapse identical cart instances into one ticket line with a summed quantity (and the
    // participants concatenated in order), so the order records "General Admission × 3" as a single
    // line item rather than three quantity-1 lines. Only single-admit tickets consolidate: a
    // group ticket is a distinct container (its own attendees + group name), so every group
    // instance keeps its own line — keyed by its unique uid, never merged with a sibling group.
    type TicketLine = RegisterPayload['tickets'][number]
    const lines = new Map<string, TicketLine>()
    for (const inst of cart.value) {
      const isGroup = event.tickets.find((t) => t.id === inst.ticket_id)?.participant_type === 'group'
      const key = isGroup ? `group:${inst.uid}` : `single:${inst.ticket_id}`
      const participants = inst.participants.map((p) => ({ field_data: p.field_data }))
      const existing = lines.get(key)
      if (existing) {
        existing.quantity += 1
        existing.participants.push(...participants)
      } else {
        lines.set(key, {
          ticket_id: inst.ticket_id,
          quantity: 1,
          group_name: inst.group_name || undefined,
          participants,
        })
      }
    }
    return {
      tickets: [...lines.values()],
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
    if (!trimmed) return t('checkout.email.required')
    if (!/.+@.+\..+/.test(trimmed)) return t('checkout.email.invalid')
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
        submitError.value = t('common.genericError')
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
