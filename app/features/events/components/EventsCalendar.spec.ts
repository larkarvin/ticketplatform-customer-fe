// customer-fe/app/features/events/components/EventsCalendar.spec.ts
//
// Pins the resize view-switch behavior: FullCalendar only reads `initialView` once at
// construction (resetOptions ignores later changes), so an already-mounted calendar must be
// driven through calendarRef.getApi().changeView(...) when the viewport crosses the md
// breakpoint. That wiring lives entirely in a `watch(isDesktop, ...)` with no pure function to
// extract cleanly (the view name is a one-line ternary), so this test mocks the `@fullcalendar/vue3`
// module + a controllable matchMedia and asserts the API call directly, per the task's stated
// fallback route. (Mocking the module rather than passing a `global.stubs` entry: `<script setup>`
// compiles a directly-imported component reference inline rather than through `resolveComponent`,
// so name-based stubbing never intercepts it — mocking the import is the reliable hook.)
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeView = vi.fn()

vi.mock('@fullcalendar/vue3', () => ({
  default: {
    name: 'FullCalendar',
    props: ['options'],
    template: '<div />',
    methods: {
      getApi() {
        return { changeView }
      },
    },
  },
}))

let mediaListener: ((e: { matches: boolean }) => void) | null = null
let mediaMatches = true

function stubMatchMedia(): void {
  mediaListener = null
  mediaMatches = true
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      get matches() {
        return mediaMatches
      },
      addEventListener: (_event: string, cb: (e: { matches: boolean }) => void) => {
        mediaListener = cb
      },
      removeEventListener: vi.fn(),
    })),
  })
}

describe('EventsCalendar', () => {
  beforeEach(() => {
    changeView.mockReset()
    stubMatchMedia()
    vi.stubGlobal('navigateTo', vi.fn())
  })

  it('switches to listMonth when the viewport crosses to mobile, and back to dayGridMonth on desktop', async () => {
    const { default: EventsCalendar } = await import('./EventsCalendar.vue')
    const w = mount(EventsCalendar, { props: { upcoming: [], past: [] } })
    await flushPromises()

    // Flip to mobile.
    mediaMatches = false
    mediaListener?.({ matches: false })
    await w.vm.$nextTick()
    expect(changeView).toHaveBeenLastCalledWith('listMonth')

    // Flip back to desktop.
    mediaMatches = true
    mediaListener?.({ matches: true })
    await w.vm.$nextTick()
    expect(changeView).toHaveBeenLastCalledWith('dayGridMonth')
  })
})
