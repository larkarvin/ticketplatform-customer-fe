// Owns the checkout's client state: buyer, per-admit attendee answers, order-level checkout answers,
// the running total, and the submit → pay handoff. No transport beyond the services.
import { isValidationError } from '#core/errors'
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { eventsService } from '~/features/events/services/events.service'
import { ordersService } from '~/features/events/services/orders.service'
import type { CheckoutSelection, PublicEvent, RegisterPayload } from '~/features/events/types'

export function usePublicCheckout(event: PublicEvent, selection: CheckoutSelection[]) {
  const buyer = reactive({ email: '', name: '', phone: '' })
  // attendeeAnswers[ticketId] = one answers-object per admit (length = quantity).
  const attendeeAnswers = reactive<Record<number, Array<Record<string, unknown>>>>({})
  const checkoutAnswers = reactive<Record<string, unknown>>({})
  const fieldErrors = ref<Record<string, string>>({})
  const submitting = ref(false)

  for (const sel of selection) {
    attendeeAnswers[sel.ticket_id] = Array.from({ length: sel.quantity }, () => ({}))
  }

  const total = computed(() =>
    selection.reduce((sum, sel) => {
      const t = event.tickets.find((x) => x.id === sel.ticket_id)
      return sum + (t ? t.price * sel.quantity : 0)
    }, 0)
  )
  const canPay = computed(() => buyer.email.trim().length > 0 && selection.length > 0 && !submitting.value)

  function buildPayload(): RegisterPayload {
    return {
      buyer: { email: buyer.email.trim(), name: buyer.name || undefined, phone: buyer.phone || undefined },
      tickets: selection.map((sel) => ({
        ticket_id: sel.ticket_id,
        quantity: sel.quantity,
        participants: (attendeeAnswers[sel.ticket_id] ?? []).map((field_data) => ({ field_data })),
      })),
      checkout: { ...checkoutAnswers },
    }
  }

  async function pay(): Promise<void> {
    if (!canPay.value) return
    submitting.value = true
    fieldErrors.value = {}
    try {
      const res = await eventsService.registerOrder(event.slug, buildPayload())
      if (res.requires_payment) {
        const back = `${window.origin}/orders/${res.order_number}`
        const { redirect_url } = await ordersService.initiatePayment(res.order_number, back)
        window.location.href = redirect_url
      } else {
        await navigateTo(`/orders/${res.order_number}`)
      }
    } catch (e: unknown) {
      // 422 → field errors keyed by field_key (reuse the core validation-error shape).
      if (isValidationError(e)) {
        fieldErrors.value = e.fields
      } else {
        toast.error("Couldn't complete your order. Please try again.")
      }
    } finally {
      submitting.value = false
    }
  }

  return { buyer, attendeeAnswers, checkoutAnswers, fieldErrors, submitting, total, canPay, pay }
}
