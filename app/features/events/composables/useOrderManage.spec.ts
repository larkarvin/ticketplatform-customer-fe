import { ValidationError } from '#core/errors'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { ordersService } from '../services/orders.service'
import type { PublicOrder } from '../types'
import { useOrderManage } from './useOrderManage'

vi.mock('../services/orders.service', () => ({
  ordersService: {
    cancelOrder: vi.fn(),
    resendLink: vi.fn(),
    submitAttendees: vi.fn(),
  },
}))

const mockCancelOrder = vi.mocked(ordersService.cancelOrder)
const mockSubmitAttendees = vi.mocked(ordersService.submitAttendees)

describe('useOrderManage.cancel', () => {
  it('cancels and replaces the order', async () => {
    mockCancelOrder.mockResolvedValue({ public_id: 'p1', payment_status: 'cancelled' } as PublicOrder)
    const order = ref<PublicOrder | null>({ public_id: 'p1', payment_status: 'pending' } as PublicOrder)
    const m = useOrderManage(order)

    await m.cancel()

    expect(mockCancelOrder).toHaveBeenCalledWith('p1')
    expect(order.value?.payment_status).toBe('cancelled')
  })
})

describe('useOrderManage.submitAttendees', () => {
  it('maps a 422 validation error into attendeeErrors keyed `${index}.${field_key}` and returns false', async () => {
    mockSubmitAttendees.mockRejectedValue(
      new ValidationError({
        'participants.0.field_data.shirt_size': 'The shirt size field is required.',
      }),
    )
    const order = ref<PublicOrder | null>({ public_id: 'p1', payment_status: 'pending' } as PublicOrder)
    const m = useOrderManage(order)

    const result = await m.submitAttendees([])

    expect(result).toBe(false)
    expect(m.attendeeErrors.value).toEqual({ '0.shirt_size': 'The shirt size field is required.' })
    expect(m.savingAttendees.value).toBe(false)
  })
})
