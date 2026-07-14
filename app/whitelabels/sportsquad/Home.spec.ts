// app/whitelabels/sportsquad/Home.spec.ts — regression guard for the gap found in browser
// verification: the sportsquad HOME page ports its own static footer (the app chrome's footer,
// which carries the "Find my order" recovery link, is hidden on this page). Home's own footer
// must therefore carry a working /recover link too, or a stranded guest landing on home has no
// way back into their order.
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Home from './Home.vue'

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  EventCard: true,
  EventListing: true,
}

describe('sportsquad Home footer', () => {
  it('renders a working link to /recover using the shared recovery copy', async () => {
    vi.stubGlobal('useHead', vi.fn())
    vi.stubGlobal('useSeoMeta', vi.fn())
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteUrl: 'https://sportsquad.test' } }))
    vi.stubGlobal('useRequestURL', () => new URL('https://sportsquad.test/'))

    const w = mount(Home, {
      props: { events: [], staffUrl: '', error: undefined },
      global: { stubs },
    })
    await w.vm.$nextTick()

    const link = w.find('[data-sq="recover"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/recover')
    expect(link.text()).toBe('Find my order')

    vi.unstubAllGlobals()
  })
})
