// customer-fe/app/pages/e/[slug]/index.spec.ts
//
// The "Already registered?" line is the escape hatch for the guest who is one tap away from buying the
// same ticket twice — so it has to be readable by the person most likely to need it. Our audience is
// 60+: 16px is the floor, and this line is kept subordinate by placement and colour, never by shrinking
// the type. Guard the size (and the link's destination); the rest of the page is out of scope here.
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, ref, Suspense } from 'vue'

vi.mock('~/features/events', async () => {
  const stub = { template: '<div />' }
  return {
    EventBanner: stub,
    EventDetailsBody: stub,
    EventHero: stub,
    EventShare: stub,
    EventTicketList: stub,
    useEventSeo: () => {},
    usePublicEvent: async () => ({
      event: { id: 1, slug: 'parish-fair', title: 'Parish Fair', cover: null, details: '', tickets: [] },
    }),
  }
})

beforeEach(() => {
  vi.stubGlobal('useRoute', () => ({ params: { slug: 'parish-fair' } }))
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteUrl: 'https://site.test', appName: 'Tickets' } }))
  vi.stubGlobal('useTenant', () => ({ branding: ref(null) }))
  vi.stubGlobal('navigateTo', vi.fn())
})

import EventPage from './index.vue'

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
}

// The page's <script setup> awaits the event, so it needs a <Suspense> boundary to mount.
async function mountPage() {
  const w = mount({ render: () => h(Suspense, () => h(EventPage)) }, { global: { stubs } })
  await flushPromises()
  return w
}

describe('e/[slug]/index.vue — the recovery link', () => {
  it('points a guest who already registered at /recover', async () => {
    const w = await mountPage()
    const link = w.findAll('a').find((a) => a.attributes('href') === '/recover')
    expect(link?.text()).toContain('Already registered? Find my order')
  })

  it('renders at 16px — never below the body floor our 60+ audience needs', async () => {
    const w = await mountPage()
    const line = w.findAll('p').find((p) => p.text().includes('Already registered?'))
    expect(line?.classes()).toContain('text-base')
    expect(line?.classes()).not.toContain('text-sm')
  })
})
