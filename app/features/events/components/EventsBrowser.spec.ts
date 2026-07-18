import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import EventsBrowser from './EventsBrowser.vue'

const upcoming = [
  {
    id: 1,
    slug: 'a',
    title: 'Upcoming A',
    description: null,
    starts_at: '2026-09-01T00:00:00Z',
    ends_at: null,
    timezone: null,
    location: null,
    currency: 'USD',
    cover: null,
    tickets: [],
  },
]
const past = [
  {
    id: 2,
    slug: 'b',
    title: 'Past B',
    description: null,
    starts_at: '2026-01-01T00:00:00Z',
    ends_at: null,
    timezone: null,
    location: null,
    currency: 'USD',
    cover: null,
    tickets: [
      {
        price: 20,
        price_formatted: 'USD 20.00',
        early_bird_price: null,
        early_bird_price_formatted: null,
        is_early_bird: false,
      },
    ],
  },
]

const refresh = vi.fn()
const errorValue = { value: undefined as unknown }

vi.mock('../composables/usePublicEvents', () => ({
  usePublicEvents: () => ({
    events: computed(() => upcoming),
    upcoming: computed(() => upcoming),
    past: computed(() => past),
    pending: computed(() => false),
    error: computed(() => errorValue.value),
    refresh,
  }),
}))

const stubs = {
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
  ClientOnly: { template: '<div><slot /></div>' },
}

describe('EventsBrowser', () => {
  afterEach(() => {
    errorValue.value = undefined
    refresh.mockReset()
  })

  it('past events never show a price, even when their event has tickets', () => {
    const w = mount(EventsBrowser, { props: { view: 'list' }, global: { stubs } })
    const pastSection = w.findAll('section').find((s) => s.text().includes('Past events'))
    expect(pastSection?.text()).not.toContain('From')
  })

  it('list view shows a retry button on error that calls refresh', async () => {
    errorValue.value = new Error('boom')
    const w = mount(EventsBrowser, { props: { view: 'list' }, global: { stubs } })
    const btn = w.find('[data-test="retry-list"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(refresh).toHaveBeenCalled()
  })

  it('calendar view shows a retry button on error that calls refresh', async () => {
    errorValue.value = new Error('boom')
    const w = mount(EventsBrowser, { props: { view: 'calendar' }, global: { stubs } })
    const btn = w.find('[data-test="retry-calendar"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(refresh).toHaveBeenCalled()
  })

  it('list view renders upcoming events and a past section', () => {
    const w = mount(EventsBrowser, { props: { view: 'list' }, global: { stubs } })
    expect(w.text()).toContain('Upcoming A')
    expect(w.text()).toContain('Past events')
    expect(w.text()).toContain('Past B')
    expect(w.find('[data-test="calendar-pane"]').exists()).toBe(false)
  })

  it('calendar view renders the calendar pane, not the list', () => {
    const w = mount(EventsBrowser, { props: { view: 'calendar' }, global: { stubs } })
    expect(w.find('[data-test="calendar-pane"]').exists()).toBe(true)
    expect(w.text()).not.toContain('Past events')
  })

  it('marks the active toggle pill for the current view', () => {
    const w = mount(EventsBrowser, { props: { view: 'calendar' }, global: { stubs } })
    expect(w.find('[data-test="toggle-calendar"]').attributes('aria-current')).toBe('page')
    expect(w.find('[data-test="toggle-list"]').attributes('aria-current')).toBeUndefined()
  })
})
