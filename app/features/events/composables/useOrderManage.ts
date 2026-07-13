// Owns order-management actions from the order page: cancel, resend link, submit attendee details.
// Calls the service (no direct $fetch); maps 422 → attendeeErrors keyed `${index}.${field_key}`.
import { isValidationError } from '#core/errors'
import { useT } from '#core/i18n'
import { ref, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import { ordersService } from '../services/orders.service'
import type { AttendeeSubmission, PublicOrder } from '../types'

export function useOrderManage(order: Ref<PublicOrder | null>) {
  const { t, term } = useT()
  const cancelling = ref(false)
  const resending = ref(false)
  const savingAttendees = ref(false)
  const attendeeErrors = ref<Record<string, string>>({})
  const resendMessage = ref<string | null>(null)

  async function cancel(): Promise<void> {
    const id = order.value?.public_id
    if (!id || cancelling.value) return
    cancelling.value = true
    try {
      order.value = await ordersService.cancelOrder(id)
    } finally {
      cancelling.value = false
    }
  }

  async function resend(): Promise<void> {
    const id = order.value?.public_id
    if (!id || resending.value) return
    resending.value = true
    try {
      const { message } = await ordersService.resendLink(id)
      resendMessage.value = message
    } finally {
      resending.value = false
    }
  }

  async function submitAttendees(participants: AttendeeSubmission[]): Promise<boolean> {
    const id = order.value?.public_id
    if (!id || savingAttendees.value) return false
    savingAttendees.value = true
    attendeeErrors.value = {}
    try {
      order.value = await ordersService.submitAttendees(id, participants)
      toast.success(t('orderHub.attendees.saved', { person: term('person') }))
      return true
    } catch (e) {
      if (isValidationError(e)) {
        // Server keys: participants.{i}.field_data.{field_key} → panel keys: {i}.{field_key}
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(e.fields)) {
          const m = k.match(/^participants\.(\d+)\.field_data\.(.+)$/)
          if (m) mapped[`${m[1]}.${m[2]}`] = v
        }
        attendeeErrors.value = mapped
      }
      return false
    } finally {
      savingAttendees.value = false
    }
  }

  return { cancel, resend, submitAttendees, cancelling, resending, savingAttendees, attendeeErrors, resendMessage }
}
