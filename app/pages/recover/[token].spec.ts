// customer-fe/app/pages/recover/[token].spec.ts
//
// The magic-link landing page has exactly three outcomes, and each one has a way it can quietly go
// wrong: the list can drift from the code path's list, the expired screen can promise an email the
// API may never send, and the invalid screen can say something about an address it must know nothing
// about. Assert the rendered output for all three — plus that nothing is decided during SSR, which is
// what keeps the plain-ref state machine from hydrating into a mismatch.
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { RecoveryItem, RecoveryStep } from '~/features/recovery'

const useSeoMeta = vi.fn()
vi.stubGlobal('useSeoMeta', useSeoMeta)
vi.stubGlobal('useRoute', () => ({ params: { token: 'magic-token-123' } }))

const step = ref<RecoveryStep>('listed')
const items = ref<RecoveryItem[]>([])
const maskedEmail = ref('')
const error = ref('')
const cooldown = ref(0)
const canResend = ref(true)
const resend = vi.fn()

// Resolves on a microtask, like the real network call — so `checking` is still true on first render.
const loadItems = vi.fn(async () => {})

// Stub the state machine (covered by useRecovery.spec.ts); keep RecoveryList real so this spec proves
// the page really renders the shared list rather than a forked copy of its markup.
vi.mock('~/features/recovery', async () => {
  const actual = await vi.importActual<typeof import('~/features/recovery')>('~/features/recovery')
  return {
    ...actual,
    useRecovery: () => ({ step, items, maskedEmail, error, cooldown, canResend, loadItems, resend }),
  }
})

import TokenPage from './[token].vue'

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
}

function order(overrides: Partial<RecoveryItem> = {}): RecoveryItem {
  return {
    type: 'order',
    title: 'Spring Gala',
    reference: '1042',
    status: 'paid',
    url: 'https://example.test/orders/abc',
    created_at: null,
    ...overrides,
  }
}

function mountPage() {
  return mount(TokenPage, { global: { stubs } })
}

async function mountLoaded() {
  const w = mountPage()
  await flushPromises()
  return w
}

describe('recover/[token].vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    step.value = 'listed'
    items.value = []
    maskedEmail.value = ''
    error.value = ''
    cooldown.value = 0
    canResend.value = true
  })

  it('decides nothing before the client has asked — the first render is the same on the server and in the browser', () => {
    step.value = 'listed'
    items.value = [order()]
    const w = mountPage()
    // onMounted has fired but its await has not resolved: still the neutral "checking" screen.
    expect(w.text()).toContain('Opening your link')
    expect(w.text()).not.toContain('Spring Gala')
  })

  it('loads with the token from the URL', async () => {
    await mountLoaded()
    expect(loadItems).toHaveBeenCalledWith('magic-token-123')
  })

  describe('listed', () => {
    it('renders the recovered rows through the shared list', async () => {
      items.value = [
        order(),
        order({ type: 'submission', reference: '', status: 'submitted', url: 'https://x/y/edit' }),
      ]
      const w = await mountLoaded()
      expect(w.text()).toContain('What we have for that address')
      expect(w.findAll('li')).toHaveLength(2)
      expect(w.findAll('li a').map((a) => a.attributes('href'))).toEqual([
        'https://example.test/orders/abc',
        'https://x/y/edit',
      ])
    })

    it('states plainly that nothing was found when the address owns nothing', async () => {
      const w = await mountLoaded()
      expect(w.text()).toContain("We couldn't find anything for that address")
      expect(w.findAll('li')).toHaveLength(0)
    })
  })

  describe('expired (410)', () => {
    beforeEach(() => {
      step.value = 'expired'
      maskedEmail.value = 'g***@example.com'
    })

    it('names the masked address the API gave back on the 410', async () => {
      const w = await mountLoaded()
      expect(w.text()).toContain('That link has expired')
      expect(w.text()).toContain('g***@example.com')
    })

    it('offers a resend without retyping the address, and never promises it arrives', async () => {
      const w = await mountLoaded()
      const button = w.find('button')
      expect(button.text()).toContain('Send another email')
      await button.trigger('click')
      expect(resend).toHaveBeenCalled()
      expect(w.text().toLowerCase()).not.toContain('on its way')
      expect(w.text().toLowerCase()).not.toContain("we've sent")
    })

    it('keeps a genuinely fresh request on screen — resend can silently send nothing after three wrong codes', async () => {
      const w = await mountLoaded()
      const startOver = w.findAll('a').find((a) => a.attributes('href') === '/recover')
      expect(startOver?.text()).toContain('Start over with a different email address')
    })
  })

  describe('invalid / tampered', () => {
    beforeEach(() => {
      // A token we cannot trust drops the state machine back to `ask` with no address at all.
      step.value = 'ask'
      error.value = 'That link is not valid. Please enter your email address to start again.'
    })

    it('explains the dead link and points at a fresh start', async () => {
      const w = await mountLoaded()
      expect(w.text()).toContain('That link did not work')
      expect(w.find('a').attributes('href')).toBe('/recover')
    })

    it('leaks nothing about whether the address exists, and shows no list', async () => {
      items.value = [order()]
      const w = await mountLoaded()
      const text = w.text().toLowerCase()
      expect(text).not.toContain('@')
      expect(text).not.toContain('we found')
      expect(text).not.toContain('what we have for that address')
      expect(w.findAll('li')).toHaveLength(0)
    })
  })
})
