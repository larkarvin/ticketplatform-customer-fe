// customer-fe/app/pages/orders/[publicId].spec.ts
//
// The fetch-error state is the exact moment a guest learns their order link is dead — the person
// guest recovery exists for. Assert the recovery link is actually rendered there, not just present
// in the brief. Everything else about this page (status states, polling, attendee panel) is out of
// scope for this spec.
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, ref, Suspense } from 'vue'

const { getOrder } = vi.hoisted(() => ({ getOrder: vi.fn() }))
vi.mock('~/features/events/services/orders.service', () => ({
  ordersService: {
    getOrder,
    paymentStatus: vi.fn(),
    cancelOrder: vi.fn(),
    resendLink: vi.fn(),
    resendReceipt: vi.fn(),
  },
}))

// Stub the Nuxt auto-imports the page relies on (runs outside a Nuxt app here) — same pattern as
// usePublicEvent.spec.ts.
beforeEach(() => {
  getOrder.mockReset()
  vi.stubGlobal('useRoute', () => ({ params: { publicId: 'dead-link-123' }, query: {} }))
  vi.stubGlobal('useAsyncData', (_key: string, handler: () => Promise<unknown>) => {
    const data = ref<unknown>(null)
    const error = ref<unknown>(null)
    const promise = Promise.resolve()
      .then(handler)
      .then((d) => {
        data.value = d
      })
      .catch((e) => {
        error.value = e
      })
    return Object.assign(promise, { data, error })
  })
  vi.stubGlobal('useSeoMeta', () => {})
})

import OrderPage from './[publicId].vue'

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  ClientOnly: { template: '<div><slot /></div>' },
  OrderAttendeePanel: true,
  OrderTicketQrList: true,
}

// The page's <script setup> has a top-level `await asyncOrder`, which makes it an async-setup
// component — Vue requires a <Suspense> boundary to mount those.
function mountPage() {
  return mount({ render: () => h(Suspense, () => h(OrderPage)) }, { global: { stubs } })
}

describe('orders/[publicId].vue — fetch-error state', () => {
  it('offers the recovery link below the retry button when the order fails to load', async () => {
    getOrder.mockRejectedValue(new Error('network error'))
    const w = mountPage()
    await flushPromises()

    expect(w.text()).toContain("Can't open your order? Find my order")
    const link = w.findAll('a').find((a) => a.attributes('href') === '/recover')
    expect(link).toBeTruthy()
  })

  it('does not show the recovery link once the order loads successfully', async () => {
    getOrder.mockResolvedValue({
      public_id: 'ok-123',
      order_number: '1000',
      payment_status: 'paid',
      items: [],
      fees: [],
      subtotal: '0',
      total: '0',
      currency: 'USD',
      can_add_attendees: false,
    })
    const w = mountPage()
    await flushPromises()

    const link = w.findAll('a').find((a) => a.attributes('href') === '/recover')
    expect(link).toBeFalsy()
  })
})
