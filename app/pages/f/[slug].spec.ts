// customer-fe/app/pages/f/[slug].spec.ts
//
// Same guard as the event page: the "Already registered?" line above a public form is what stops a
// guest submitting twice, and it is read by a 60+ audience — 16px floor, subordinate by placement and
// colour rather than by size. The form itself is out of scope here.
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, h, Suspense } from 'vue'

vi.mock('~/features/forms/composables/usePublicForm', () => ({
  usePublicForm: async () => ({ form: { title: 'Parish Raffle' } }),
}))
vi.mock('~/features/forms/components/FormRenderer.vue', () => ({
  default: { props: ['state'], template: '<div />' },
}))

// The page leans on Nuxt's auto-imports (`computed`, `useRoute`, `definePageMeta`), which don't exist
// outside a Nuxt app — same stubbing pattern as usePublicEvent.spec.ts.
beforeEach(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useRoute', () => ({ params: { slug: 'parish-raffle' } }))
  vi.stubGlobal('definePageMeta', () => {})
})

import FormPage from './[slug].vue'

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
}

// The page's <script setup> awaits the form, so it needs a <Suspense> boundary to mount.
async function mountPage() {
  const w = mount({ render: () => h(Suspense, () => h(FormPage)) }, { global: { stubs } })
  await flushPromises()
  return w
}

describe('f/[slug].vue — the recovery link', () => {
  it('points a guest who already submitted at /recover', async () => {
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
